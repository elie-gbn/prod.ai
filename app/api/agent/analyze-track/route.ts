import { auth } from "@/lib/authentication";
import { saveMessages } from "@/lib/chat-history";
import { MAX_TRACK_UPLOAD_BYTES } from "@/lib/ai/audio-upload";

export const runtime = "nodejs";

const systemPrompt = `You are a careful music production and composition reviewer. Listen to the uploaded track and give practical, specific feedback based on what is audibly present.

Use these sections:
1. Overall impression
2. Arrangement and composition structure
3. Mix and production
4. Three prioritized next steps

Discuss audible balance, masking, low-end, dynamics, stereo image, transitions, energy, repetition, and section development where relevant. Mention timestamps only when you can identify them confidently. Separate clear observations from hypotheses, do not invent measurements or claim exact EQ/compression settings, and keep advice constructive. If the user includes a focus, prioritize it.`;

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return errorResponse("Sign in to get feedback on a track.", 401);
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse("OPENAI_API_KEY is not set.", 500);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    request.headers.has("content-length") &&
    contentLength > MAX_TRACK_UPLOAD_BYTES + 100_000
  ) {
    return errorResponse("Track uploads must be 20 MB or smaller.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Upload a valid MP3 or WAV audio file.", 400);
  }

  const file = formData.get("track");
  const focusValue = formData.get("focus");
  const focus = typeof focusValue === "string" ? focusValue.trim().slice(0, 1200) : "";

  if (!(file instanceof File)) {
    return errorResponse("Choose an MP3 or WAV file to review.", 400);
  }

  if (file.size === 0 || file.size > MAX_TRACK_UPLOAD_BYTES) {
    return errorResponse(
      file.size === 0
        ? "The selected audio file is empty."
        : "Track uploads must be 20 MB or smaller.",
      file.size === 0 ? 400 : 413,
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "mp3" && extension !== "wav") {
    return errorResponse("Use an MP3 or WAV audio file.", 415);
  }

  const audioBytes = Buffer.from(await file.arrayBuffer());
  const isWave =
    extension === "wav" &&
    audioBytes.toString("ascii", 0, 4) === "RIFF" &&
    audioBytes.toString("ascii", 8, 12) === "WAVE";
  const hasMp3Header =
    audioBytes.toString("ascii", 0, 3) === "ID3" ||
    (audioBytes.length > 1 &&
      audioBytes[0] === 0xff &&
      (audioBytes[1] & 0xe0) === 0xe0);
  const isMp3 = extension === "mp3" && hasMp3Header;

  if (!isWave && !isMp3) {
    return errorResponse("The file contents do not match an MP3 or WAV audio track.", 415);
  }

  const format = isWave ? "wav" : "mp3";
  const focusText = focus
    ? `\nThe user wants particular attention on: ${focus}`
    : "";

  try {
    const modelResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-audio-1.5",
        modalities: ["text"],
        store: false,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Review this music track for mixing, production, and composition structure. Be specific about what you hear.${focusText}`,
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBytes.toString("base64"),
                  format,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!modelResponse.ok) {
      console.error("Audio review model request failed:", modelResponse.status);
      return errorResponse(
        "Could not analyze this track. Try a shorter MP3 or WAV file.",
        502,
      );
    }

    const result = (await modelResponse.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const feedback = result.choices?.[0]?.message?.content?.trim();

    if (!feedback) {
      return errorResponse("The audio model returned no feedback. Please try again.", 502);
    }

    const userMessage = `Review uploaded track: ${file.name}${focus ? `\nFocus: ${focus}` : ""}`;
    await saveMessages(userEmail, [
      { role: "user", content: userMessage },
      { role: "assistant", content: feedback },
    ]);

    return Response.json({ response: feedback });
  } catch (error) {
    console.error("Audio track review failed:", error);
    return errorResponse("Track analysis failed. Please try again.", 500);
  }
}