import { MongoClient, ObjectId } from "mongodb";

// Random products catalog for mocking
const rawProducts = [
    {
        name: "Bowl de Quinoa Real",
        description: "Quinoa tricolor orgânica temperada no ponto, acompanhada de legumes assados e proteína de ervilha.",
        price: 38.90,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
        category: "Vegan"
    },
    {
        name: "Hambúrguer de Shiitake",
        description: "Pão de fermentação natural, blend de cogumelos shiitake e cogumelo paris defumado, com queijo vegano e maionese verde artesanal.",
        price: 42.50,
        imageUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop",
        category: "Vegan"
    },
    {
        name: "Nhoque de Batata Doce",
        description: "Massa leve de batata doce roxa sem glúten, servida ao molho sugo de tomates italianos frescos e manjericão.",
        price: 45.00,
        imageUrl: "https://images.unsplash.com/photo-1595295333158-4742f28fbc85?w=400&h=400&fit=crop",
        category: "Gluten-Free"
    },
    {
        name: "Salada Tropical Mix",
        description: "Mix folhas verdes da fazenda, manga palmer, tomate cereja, sementes de girassol tostadas ao molho cítrico especial.",
        price: 34.90,
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
        category: "Vegan"
    },
    {
        name: "Risoto de Aspargos",
        description: "Arroz arbório cozido lentamente no caldo de vinho branco, queijo parmesão ralado na hora e aspargos grelhados perfeitamente crocantes.",
        price: 52.00,
        imageUrl: "https://plus.unsplash.com/premium_photo-1663840248384-7fc1e23363cb?w=400&h=400&fit=crop",
        category: "Gluten-Free"
    },
    {
        name: "Taco Veggie Gourmet",
        description: "Tortilhas crocantes recheadas com carne de jaca desfiada moída temperada, guacamole e pico de gallo.",
        price: 29.90,
        imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop",
        category: "Vegan"
    }
];

const TARGET_IDS = [
  "699a62c5d5c40986e0268ae9",
  "699a62c5d5c40986e0268aea",
  "699a62c5d5c40986e0268aeb",
  "699a62c5d5c40986e0268aec",
  "699a62c5d5c40986e0268aed",
  "699a62c5d5c40986e0268aee",
  "699a62c5d5c40986e0268aef",
  "699a62c5d5c40986e0268af0",
  "699a62c5d5c40986e0268af1",
  "699a62c5d5c40986e0268af2"
];

async function seedMenus() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/helprest";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        
        // Use default database (parsed from connection string or "helprest")
        // If your connection string already contains the database name,
        // client.db() will automatically resolve to it. We provide "helprest" 
        // merely as a fallback.
        const db = client.db("helprest");
        const productsCollection = db.collection("products");

        console.log(`Conectado ao banco de dados: ${db.databaseName}`);
        console.log(`Iniciando a inserção de cardápios falsos para ${TARGET_IDS.length} restaurantes...`);

        // Deletar cardápios antigos (opcional, para idempotência)
        const objectIds = TARGET_IDS.map((id) => new ObjectId(id));
        const resDelete = await productsCollection.deleteMany({ establishmentId: { $in: objectIds } });
        console.log(`Limpou ${resDelete.deletedCount} produtos existentes nesses estabelecimentos para evitar duplicidade.`);

        const productsToInsert: any[] = [];
        
        for (const establishmentIdStr of TARGET_IDS) {
            const establishmentId = new ObjectId(establishmentIdStr);

            // Shuffling rawProducts to add some variety
            const shuffledProducts = [...rawProducts].sort(() => 0.5 - Math.random());
            const numProducts = Math.floor(Math.random() * 3) + 4; // Generate between 4 and 6 products

            const selectedProducts = shuffledProducts.slice(0, numProducts);

            for (const prod of selectedProducts) {
                productsToInsert.push({
                    _id: new ObjectId(),
                    establishmentId: establishmentId,
                    category: prod.category,
                    name: prod.name,
                    description: prod.description,
                    price: prod.price,
                    imageUrl: prod.imageUrl,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        if (productsToInsert.length > 0) {
            const result = await productsCollection.insertMany(productsToInsert);
            console.log(`Seeding completo! ${result.insertedCount} itens de cardápio inseridos.`);
        } else {
            console.log("Nenhum item gerado.");
        }

    } catch (error) {
        console.error("Erro durante o seeding:", error);
    } finally {
        await client.close();
        console.log("Conexão fechada.");
    }
}

seedMenus();
