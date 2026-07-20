import { MongoClient } from "mongodb";


const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/helprest";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Connected to the database");
        const db = client.db("helprest");
        const productsCol = db.collection("products");
        const flagsCol = db.collection("flags");

        const flags = await flagsCol.find().toArray();
        const flagMap = new Map<string, any>();
        for (const flag of flags) {
            flagMap.set(flag.identifier.toLowerCase(), flag._id);
        }

        const products = await productsCol.find({ category: { $exists: true } }).toArray();
        console.log(`Found ${products.length} products to migrate`);

        let migratedCount = 0;
        for (const prod of products) {
            if (prod.category) {
                let idToUse = flagMap.get(prod.category.toLowerCase());
                if (!idToUse) {
                    if (prod.category === "Gluten-Free") idToUse = flagMap.get("gluten-free");
                }
                if (idToUse) {
                    await productsCol.updateOne(
                        { _id: prod._id },
                        { 
                            $set: { flags: [idToUse] },
                            $unset: { category: "" }
                        }
                    );
                    migratedCount++;
                }
            }
        }
        console.log(`Successfully migrated ${migratedCount} products to use flags array.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
