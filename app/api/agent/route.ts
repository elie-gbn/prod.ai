import { run } from "@openai/agents";
import { agent } from "@/lib/ai/agent";
import { auth } from "@/lib/authentication";
import {
  formatHistoryForAgent,
  getHistory,
  saveMessages,
} from "@/lib/chat-history";
import {
  forget,
  getMemories,
  getMemoryCommand,
  remember,
} from "@/lib/ai/memory";
import { genres, moods, musicalKeys } from "@/lib/ai/music-options";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return Response.json({ history: [] }, { status: 200 });
  }

  try {
    const history = await getHistory(20, userEmail);
    return Response.json({ history });
  } catch (error) {
    return Response.json(
      { error: `failed to load history: ${error}` },
      { status: 500 },
    );
  }
}

const bodySchema = z.object({
  message: z
    .string()
    .max(10000)
    .default("")
    .describe("An optional creative direction or question"),
  task: z.enum(["compose", "ask"]).default("ask"),
  composition: z
    .object({
      key: z.enum(musicalKeys),
      mode: z.enum(["major", "minor"]),
      mood: z.enum(moods),
      genre: z.enum(genres),
    })
    .optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set" },
      { status: 500 },
    );
  }

  if (!userEmail) {
    return Response.json(
      { error: "You must be signed in to use the agent." },
      { status: 401 },
    );
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch (error) {
    return Response.json(
      { error: `request is not valid JSON: ${error}` },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Send a valid message and composition settings." },
      { status: 400 },
    );
  }

  const creativeDirection = parsed.data.message.trim();
  if (parsed.data.task === "compose" && !parsed.data.composition) {
    return Response.json(
      { error: "Choose composition settings before generating MIDI." },
      { status: 400 },
    );
  }
  if (!creativeDirection && !parsed.data.composition) {
    return Response.json(
      { error: "Send a question or choose composition settings first." },
      { status: 400 },
    );
  }

  const currentMessage =
    parsed.data.task === "compose" && parsed.data.composition
      ? `Compose an original 8-bar MIDI in ${parsed.data.composition.key} ${parsed.data.composition.mode}, with a ${parsed.data.composition.mood} mood and ${parsed.data.composition.genre} style.${creativeDirection ? ` Creative direction: ${creativeDirection}` : ""}`
      : `Music question: ${creativeDirection}`;

  try {
    const recentHistory = await getHistory(20, userEmail);
    let memories = await getMemories(userEmail);
    const memoryCommand = getMemoryCommand(creativeDirection);

    if (memoryCommand?.action === "remember") {
      await remember(userEmail, memoryCommand.content);
      memories = await getMemories(userEmail);
    } else if (memoryCommand?.action === "forget") {
      await forget(userEmail, memoryCommand.content);
      memories = await getMemories(userEmail);
    }

    const memoryContext = memories.length
      ? memories.map((memory) => `- ${memory.content}`).join("\n")
      : "(none)";
    const historyContext = formatHistoryForAgent(recentHistory) || "(none)";
    const agentInput = `
You have private context for this user. Use it only when relevant and do not mention these sections unless asked.

Saved user memories:
${memoryContext}

Recent conversation:
${historyContext}

Current user message:
${currentMessage}
`;

    const result = await run(agent, agentInput);
    const response =
      result.finalOutput || "I'm sorry, I'm not sure what you mean.";

    const midiOutput = (result.newItems ?? [])
      .map((item) => item as unknown as { type?: string; output?: unknown })
      .find((item) => {
        if (item.type !== "tool_call_output_item" || !item.output) return false;
        const output = item.output as Record<string, unknown>;
        return (
          typeof output.filename === "string" &&
          typeof output.base64 === "string"
        );
      })?.output as
      | {
          filename: string;
          base64: string;
          key: string;
          mode: string;
          mood: string;
          genre: string;
          tempo: number;
          bars: number;
        }
      | undefined;

    const toolUsed = (result.newItems ?? [])
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];

        const itemRecord = item as unknown as Record<string, unknown>;
        const toolEntries =
          itemRecord.toolUsed ?? itemRecord.toolCall ?? itemRecord.toolCalls ?? [];
        return Array.isArray(toolEntries)
          ? toolEntries
          : toolEntries
            ? [toolEntries]
            : [];
      })
      .find((tool) => {
        if (!tool || typeof tool !== "object") return false;
        const toolRecord = tool as Record<string, unknown>;
        return (
          typeof toolRecord.name === "string" &&
          toolRecord.name !== "get_info_track"
        );
      });

    const normalizedToolUsed =
      toolUsed && typeof toolUsed === "object" && "name" in toolUsed
        ? [
            {
              name: String((toolUsed as Record<string, unknown>).name),
              input:
                typeof (toolUsed as Record<string, unknown>).input === "string"
                  ? ((toolUsed as Record<string, unknown>).input as string)
                  : JSON.stringify(
                      (toolUsed as Record<string, unknown>).input ?? {},
                    ),
            },
          ]
        : undefined;

    await saveMessages(userEmail, [
      {
        role: "user",
        content: currentMessage,
        toolUsed: undefined,
      },
      {
        role: "assistant",
        content: response,
        toolUsed: normalizedToolUsed,
      },
    ]);

    return Response.json({
      response,
      midi: midiOutput,
      toolUsed: normalizedToolUsed?.[0] ?? null,
      history: recentHistory,
    });
  } catch (error) {
    return Response.json(
      { error: `failed to run agent: ${error}` },
      { status: 500 },
    );
  }
}