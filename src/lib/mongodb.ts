import { MongoClient, Db } from "mongodb";

// Real MongoDB Atlas Connection credentials provided by user
const MONGODB_URI = "mongodb+srv://admin:16Paradox2006@cluster0.jxhcqpt.mongodb.net/?appName=Cluster0";
const MONGODB_DB_NAME = "nexus";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  try {
    // Standard connection pooling settings
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    console.log("[MONGO ATLAS] Connected successfully to clustered database: " + MONGODB_DB_NAME);
    db = client.db(MONGODB_DB_NAME);
    return db;
  } catch (err) {
    console.error("[MONGO ERROR] Unable to establish active Atlas database connections:", err);
    throw err;
  }
}

export function getClient(): MongoClient | null {
  return client;
}
