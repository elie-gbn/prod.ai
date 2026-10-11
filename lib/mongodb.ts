import { MongoClient, type Collection, type Db, type Document } from "mongodb";

const globalForMongo = global as unknown as typeof globalThis & {
  mongoClient: MongoClient;
  mongoPromise: Promise<MongoClient>;
};

function configMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  return { uri };
}

export const getMongoClient = async () => {
  if (globalForMongo.mongoClient) return globalForMongo.mongoClient;

  if (!globalForMongo.mongoPromise) {
    globalForMongo.mongoPromise = MongoClient.connect(configMongo().uri);
  }
  return await globalForMongo.mongoPromise;
};

export const getMongoDb = async () => {
  const client = await getMongoClient();
  return client.db("agent-db") as Db;
};

export const getMongoCollection = async <T extends Document>(collectionName: string) => {
  const db = await getMongoDb();
  return db.collection<T>(collectionName) as Collection<T>;
};
