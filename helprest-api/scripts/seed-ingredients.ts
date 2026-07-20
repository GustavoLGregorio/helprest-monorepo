import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/helprest";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("helprest");
        const productsCol = db.collection("products");

        await productsCol.updateMany(
            { name: "Hambúrguer de Shiitake" },
            { $set: { ingredients: ["Pão vegano de fermentação natural", "Blend especial de cogumelos shiitake e paris defumados", "Alface americana crespa", "Tomate caqui", "Maionese artesanal de abacate com alho assado"] } }
        );

        await productsCol.updateMany(
            { name: "Nhoque de Batata Doce" },
            { $set: { ingredients: ["Batata doce roxa orgânica", "Farinha de arroz sem glúten", "Molho sugo rústico de tomates italianos frescos", "Manjericão fresco", "Fio de azeite extra virgem de primeira prensa"] } }
        );

        console.log("Successfully seeded ingredients.");
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
run();
