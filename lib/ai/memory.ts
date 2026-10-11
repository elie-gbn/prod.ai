import { getMongoCollection } from "@/lib/mongodb";

export type MemoryDoc = {
  userEmail: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

async function memoriesCollection() {
  return getMongoCollection<MemoryDoc>("memories");
}

export async function getMemories(userEmail: string, limit = 20) {
  const collection = await memoriesCollection();

  return collection
    .find({ userEmail })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
}

export async function remember(userEmail: string, content: string) {
  const collection = await memoriesCollection();
  const now = new Date();

  await collection.updateOne(
    { userEmail, content },
    {
      $set: { updatedAt: now },
      $setOnInsert: { userEmail, content, createdAt: now },
    },
    { upsert: true },
  );
}

export async function forget(userEmail: string, content: string) {
  const collection = await memoriesCollection();
  await collection.deleteOne({ userEmail, content });
}

export function getMemoryCommand(message: string) {
  const rememberMatch = message.match(
    /\b(?:remember|keep in mind|don't forget)\s+(?:that\s+)?(.+?)[.!?]?$/i,
  );
  if (rememberMatch?.[1]) {
    return { action: "remember" as const, content: rememberMatch[1].trim() };
  }

  const forgetMatch = message.match(
    /\b(?:forget|don't remember)\s+(?:that\s+)?(.+?)[.!?]?$/i,
  );
  if (forgetMatch?.[1]) {
    return { action: "forget" as const, content: forgetMatch[1].trim() };
  }

  return null;
}