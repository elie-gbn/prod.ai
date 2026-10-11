import { compare, hash } from "bcryptjs";
import type { WithId } from "mongodb";
import { getMongoDb, getMongoClient } from "./mongodb";

export type UserDoc = {
  name: string;
  email: string;
  image: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function userCollection() {
  const db = await getMongoDb();
  return db.collection<UserDoc>("users");
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const users = await userCollection();
  const found = await users.findOne({ email: normalized });
  if (found) return found;

  const db = await getMongoDb();
  if (db.databaseName === "agent-db") return null;

  const client = await getMongoClient();
  return client
    .db("agent-db")
    .collection<UserDoc>("users")
    .findOne({ email: normalized });
}

export async function createUser(email: string, password: string) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    throw new Error("Invalid email or password");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const existing = await findUserByEmail(normalized);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const users = await userCollection();
  return users.insertOne({
    name: "",
    image: "",
    email: normalized,
    passwordHash: await hash(password, 10),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function verifyPassword(
  email: string,
  password: string,
): Promise<WithId<UserDoc> | null> {
  const user = await findUserByEmail(email);
  if (!user?.passwordHash) return null;

  const matches = await compare(password, user.passwordHash);
  if (!matches) return null;

  return user;
}
