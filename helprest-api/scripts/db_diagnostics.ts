import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/helprest";

async function diagnose() {
    console.log("Connecting to MongoDB Atlas...");
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db();
        console.log(`Successfully connected. Database Name: "${db.databaseName}"\n`);

        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections:`);
        for (const col of collections) {
            console.log(` - ${col.name}`);
        }
        console.log("\n==================================================");

        for (const colInfo of collections) {
            const name = colInfo.name;
            const collection = db.collection(name);

            const count = await collection.countDocuments();
            console.log(`\nCollection: "${name}" (${count} documents)`);

            // Fetch indexes
            const indexes = await collection.indexes();
            console.log("Indexes:");
            for (const idx of indexes) {
                console.log(` - Name: ${idx.name}, Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}`);
            }

            // Fetch sample document
            const sample = await collection.findOne();
            if (sample) {
                console.log("Sample Document:");
                console.log(JSON.stringify(sample, null, 2));
            } else {
                console.log("Sample Document: (empty collection)");
            }
            console.log("--------------------------------------------------");
        }

    } catch (error) {
        console.error("Database diagnostics failed:", error);
    } finally {
        await client.close();
    }
}

diagnose();
