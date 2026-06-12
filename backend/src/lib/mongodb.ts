import { MongoClient, Db } from "mongodb";

// Real MongoDB Atlas Connection config loaded dynamically from environment variables
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "nexus";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error("Local fallback active");
  }

  try {
    // Standard connection pooling settings with TLS compatibility and quick failure detection
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 6,
      minPoolSize: 1,
      connectTimeoutMS: 2500,
      serverSelectionTimeoutMS: 2500,
      tlsAllowInvalidCertificates: true,
      family: 4,
    });
    
    await client.connect();
    console.log("[DATABASE SYSTEM] Connected successfully to clustered database: " + MONGODB_DB_NAME);
    db = client.db(MONGODB_DB_NAME);
    return db;
  } catch (err: any) {
    console.log("[DATABASE SYSTEM INFO] Atlas clustered DB not reachable or IP Access Restricted. Running with local offline JSON database fallback.");
    throw new Error("Local fallback active");
  }
}

export function getClient(): MongoClient | null {
  return client;
}
