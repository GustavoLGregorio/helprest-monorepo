import { MongoClient, type Db } from "mongodb";
import { logger } from "@shared/utils/logger";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
    if (db) return db;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI environment variable is not set");
    }

    client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30_000,
        connectTimeoutMS: 10_000,
        serverSelectionTimeoutMS: 10_000,
    });

    await client.connect();
    db = client.db();

    logger.info("Connected to MongoDB", { database: db.databaseName });

    return db;
}

export function getDatabase(): Db {
    if (!db) {
        throw new Error("Database not initialized. Call connectToDatabase() first.");
    }
    return db;
}

export async function disconnectDatabase(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        logger.info("Disconnected from MongoDB");
    }
}
