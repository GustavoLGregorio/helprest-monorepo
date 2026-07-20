/**
 * MongoDB Seed Script
 *
 * Populates the database with:
 * - 8 dietary flags with curated colors
 * - 10 sample establishments in the Curitiba/PR region
 * - 2 test users
 *
 * Usage: bun run scripts/seed.ts
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/helprest";

async function seed() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db();
        console.log(`Connected to database: ${db.databaseName}`);

        // ── Clear existing data ──
        await db.collection("flags").deleteMany({});
        await db.collection("establishments").deleteMany({});
        await db.collection("users").deleteMany({});
        await db.collection("visits").deleteMany({});
        console.log("Cleared existing collections");

        // ═══════════════════════════════════════════════════════
        //  FLAGS (dietary restrictions with curated colors)
        // ═══════════════════════════════════════════════════════

        const flags = [
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "vegan",
                description: "Estabelecimento com opções veganas",
                tag: "Vegano",
                backgroundColor: "#27AE60",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "vegetarian",
                description: "Estabelecimento com opções vegetarianas",
                tag: "Vegetariano",
                backgroundColor: "#6FCF97",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "celiac",
                description: "Estabelecimento com opções sem glúten para celíacos",
                tag: "Celíaco",
                backgroundColor: "#F2994A",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "lactose-free",
                description: "Estabelecimento com opções sem lactose",
                tag: "Sem Lactose",
                backgroundColor: "#56CCF2",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "gluten-free",
                description: "Estabelecimento com opções sem glúten",
                tag: "Sem Glúten",
                backgroundColor: "#BB6BD9",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "organic",
                description: "Estabelecimento com ingredientes orgânicos",
                tag: "Orgânico",
                backgroundColor: "#219653",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "kosher",
                description: "Estabelecimento com opções kosher",
                tag: "Kosher",
                backgroundColor: "#2D9CDB",
                textColor: "#FFFFFF",
            },
            {
                _id: new ObjectId(),
                type: "dietary",
                identifier: "halal",
                description: "Estabelecimento com opções halal",
                tag: "Halal",
                backgroundColor: "#EB5757",
                textColor: "#FFFFFF",
            },
        ];

        await db.collection("flags").insertMany(flags);
        console.log(`Inserted ${flags.length} flags`);

        // Helper to get flag IDs by identifier
        const flagMap = new Map(flags.map((f) => [f.identifier, f._id]));

        // ═══════════════════════════════════════════════════════
        //  ESTABLISHMENTS (Curitiba/PR region)
        // ═══════════════════════════════════════════════════════

        const establishments = [
            {
                _id: new ObjectId(),
                companyName: "Vegano Bistrô",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Batel",
                    address: "Rua Bispo Dom José, 2117",
                    coordinates: { type: "Point", coordinates: [-49.2894, -25.4412] },
                },
                flags: [flagMap.get("vegan")!, flagMap.get("organic")!],
                logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
                rating: 4.7,
                ratingCount: 85,
                ratingTotal: 400,
                isSponsored: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Natureba Café",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Centro",
                    address: "Rua XV de Novembro, 453",
                    coordinates: { type: "Point", coordinates: [-49.2699, -25.4296] },
                },
                flags: [flagMap.get("vegetarian")!, flagMap.get("lactose-free")!, flagMap.get("gluten-free")!],
                logo: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop",
                rating: 4.3,
                ratingCount: 62,
                ratingTotal: 267,
                isSponsored: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Green Kitchen",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Água Verde",
                    address: "Av. República Argentina, 1842",
                    coordinates: { type: "Point", coordinates: [-49.2801, -25.4538] },
                },
                flags: [flagMap.get("vegan")!, flagMap.get("gluten-free")!],
                logo: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&h=200&fit=crop",
                rating: 4.5,
                ratingCount: 120,
                ratingTotal: 540,
                isSponsored: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Bio Empório",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Juvevê",
                    address: "Rua Augusto Stresser, 55",
                    coordinates: { type: "Point", coordinates: [-49.2623, -25.4142] },
                },
                flags: [flagMap.get("organic")!, flagMap.get("vegetarian")!, flagMap.get("celiac")!],
                logo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop",
                rating: 4.1,
                ratingCount: 47,
                ratingTotal: 193,
                isSponsored: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Sabor Sem Glúten",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Santa Felicidade",
                    address: "Av. Manoel Ribas, 5681",
                    coordinates: { type: "Point", coordinates: [-49.3370, -25.3972] },
                },
                flags: [flagMap.get("gluten-free")!, flagMap.get("celiac")!, flagMap.get("lactose-free")!],
                logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
                rating: 4.6,
                ratingCount: 93,
                ratingTotal: 428,
                isSponsored: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Raízes Restaurante",
                location: {
                    state: "PR",
                    city: "São José dos Pinhais",
                    neighborhood: "Centro",
                    address: "Rua Joinville, 1920",
                    coordinates: { type: "Point", coordinates: [-49.2075, -25.5361] },
                },
                flags: [flagMap.get("vegan")!, flagMap.get("vegetarian")!, flagMap.get("organic")!],
                logo: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop",
                rating: 4.0,
                ratingCount: 38,
                ratingTotal: 152,
                isSponsored: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Kosher Delícias",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Hugo Lange",
                    address: "Rua Schiller, 236",
                    coordinates: { type: "Point", coordinates: [-49.2555, -25.4201] },
                },
                flags: [flagMap.get("kosher")!, flagMap.get("halal")!],
                logo: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop",
                rating: 4.8,
                ratingCount: 29,
                ratingTotal: 139,
                isSponsored: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Lactose Zero",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Cabral",
                    address: "Rua Nilo Peçanha, 1218",
                    coordinates: { type: "Point", coordinates: [-49.2582, -25.4053] },
                },
                flags: [flagMap.get("lactose-free")!, flagMap.get("vegetarian")!],
                logo: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop",
                rating: 4.2,
                ratingCount: 54,
                ratingTotal: 227,
                isSponsored: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Prana Fit Food",
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Bigorrilho",
                    address: "Rua Martim Afonso, 748",
                    coordinates: { type: "Point", coordinates: [-49.2932, -25.4345] },
                },
                flags: [flagMap.get("vegan")!, flagMap.get("gluten-free")!, flagMap.get("organic")!],
                logo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
                rating: 4.9,
                ratingCount: 142,
                ratingTotal: 696,
                isSponsored: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                companyName: "Empório Vital",
                location: {
                    state: "PR",
                    city: "Araucária",
                    neighborhood: "Centro",
                    address: "Rua Dr. Victor do Amaral, 82",
                    coordinates: { type: "Point", coordinates: [-49.3952, -25.5934] },
                },
                flags: [flagMap.get("vegetarian")!, flagMap.get("celiac")!],
                logo: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200&h=200&fit=crop",
                rating: 3.8,
                ratingCount: 21,
                ratingTotal: 80,
                isSponsored: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await db.collection("establishments").insertMany(establishments);
        console.log(`Inserted ${establishments.length} establishments`);

        // ═══════════════════════════════════════════════════════
        //  USERS (test accounts)
        // ═══════════════════════════════════════════════════════

        // Password: "teste123" hashed with Argon2id
        // To generate: bun -e "import argon2 from 'argon2'; console.log(await argon2.hash('teste123', {type: argon2.argon2id}))"
        const argon2 = await import("argon2");
        const testPasswordHash = await argon2.hash("teste123", {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 2,
        });

        const users = [
            {
                _id: new ObjectId(),
                name: "João Teste",
                email: "joao@teste.com",
                passwordHash: testPasswordHash,
                birthDate: new Date("1995-03-15"),
                flags: [flagMap.get("vegan")!, flagMap.get("gluten-free")!],
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Centro",
                    address: "Praça Tiradentes, 100",
                    coordinates: { type: "Point", coordinates: [-49.2700, -25.4290] },
                },
                socialLinksEnabled: false,
                socialLinks: null,
                profilePhoto: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                _id: new ObjectId(),
                name: "Maria Teste",
                email: "maria@teste.com",
                passwordHash: testPasswordHash,
                birthDate: new Date("1998-07-22"),
                flags: [flagMap.get("vegetarian")!, flagMap.get("lactose-free")!, flagMap.get("celiac")!],
                location: {
                    state: "PR",
                    city: "Curitiba",
                    neighborhood: "Batel",
                    address: "Rua Visconde de Nácar, 500",
                    coordinates: { type: "Point", coordinates: [-49.2850, -25.4380] },
                },
                socialLinksEnabled: true,
                socialLinks: {
                    instagram: "@maria.teste",
                    facebook: null,
                    twitter: null,
                    tiktok: null,
                    website: null,
                },
                profilePhoto: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        await db.collection("users").insertMany(users);
        console.log(`Inserted ${users.length} users`);

        // ── Seed Products for all establishments ──
        const rawProducts = [
            {
                name: "Bowl de Quinoa Real",
                description: "Quinoa tricolor orgânica temperada no ponto, acompanhada de legumes assados e proteína de ervilha.",
                price: 38.90,
                imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
                category: "Saudável",
                flags: [flagMap.get("vegan")!, flagMap.get("organic")!]
            },
            {
                name: "Hambúrguer de Shiitake",
                description: "Pão de fermentação natural, blend de cogumelos shiitake e cogumelo paris defumado, com queijo vegano e maionese verde artesanal.",
                price: 42.50,
                imageUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop",
                category: "Lanches",
                flags: [flagMap.get("vegan")!, flagMap.get("vegetarian")!]
            },
            {
                name: "Nhoque de Batata Doce",
                description: "Massa leve de batata doce roxa sem glúten, servida ao molho sugo de tomates italianos frescos e manjericão.",
                price: 45.00,
                imageUrl: "https://images.unsplash.com/photo-1595295333158-4742f28fbc85?w=400&h=400&fit=crop",
                category: "Massas",
                flags: [flagMap.get("gluten-free")!, flagMap.get("celiac")!]
            },
            {
                name: "Salada Tropical Mix",
                description: "Mix folhas verdes da fazenda, manga palmer, tomate cereja, sementes de girassol tostadas ao molho cítrico especial.",
                price: 34.90,
                imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
                category: "Saladas",
                flags: [flagMap.get("vegan")!, flagMap.get("vegetarian")!, flagMap.get("organic")!]
            },
            {
                name: "Risoto de Aspargos",
                description: "Arroz arbório cozido lentamente no caldo de vinho branco, queijo parmesão ralado na hora e aspargos grelhados perfeitamente crocantes.",
                price: 52.00,
                imageUrl: "https://plus.unsplash.com/premium_photo-1663840248384-7fc1e23363cb?w=400&h=400&fit=crop",
                category: "Risotos",
                flags: [flagMap.get("gluten-free")!, flagMap.get("vegetarian")!]
            },
            {
                name: "Taco Veggie Gourmet",
                description: "Tortilhas crocantes recheadas com carne de jaca desfiada moída temperada, guacamole e pico de gallo.",
                price: 29.90,
                imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop",
                category: "Mexicanos",
                flags: [flagMap.get("vegan")!, flagMap.get("halal")!]
            }
        ];

        await db.collection("products").deleteMany({});

        const productsToInsert = [];
        for (const est of establishments) {
            const estFlags = new Set(est.flags.map(f => f.toHexString()));
            const compatibleProducts = rawProducts.filter(p => 
                p.flags.some(f => estFlags.has(f.toHexString()))
            );

            const sourceProducts = compatibleProducts.length > 0 ? compatibleProducts : rawProducts;
            
            for (const prod of sourceProducts) {
                productsToInsert.push({
                    _id: new ObjectId(),
                    establishmentId: est._id,
                    flags: prod.flags,
                    name: prod.name,
                    description: prod.description,
                    price: prod.price,
                    imageUrl: prod.imageUrl,
                    ingredients: prod.name.split(" "),
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        if (productsToInsert.length > 0) {
            await db.collection("products").insertMany(productsToInsert);
            console.log(`Inserted ${productsToInsert.length} products`);
        }

        // ── Seed Visits (Social reviews with photos) ──
        const visits = [
            {
                _id: new ObjectId(),
                establishmentId: establishments[0]!._id, // Vegano Bistrô
                userId: users[0]!._id, // João
                date: new Date(Date.now() - 3600000 * 24), // 1 day ago
                review: "Comida vegana sensacional! O hambúrguer de shiitake estava no ponto ideal e a maionese verde artesanal é de outro mundo.",
                rating: 5,
                photoUrls: ["https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&h=400&fit=crop"],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                establishmentId: establishments[1]!._id, // Natureba Café
                userId: users[1]!._id, // Maria
                date: new Date(Date.now() - 3600000 * 5), // 5 hours ago
                review: "Muito gostoso o café e as opções sem lactose. O atendimento foi rápido, mas o preço é um pouco elevado.",
                rating: 4,
                photoUrls: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop"],
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                establishmentId: establishments[2]!._id, // Green Kitchen
                userId: users[0]!._id, // João
                date: new Date(Date.now() - 3600000 * 48), // 2 days ago
                review: "O nhoque de batata doce é uma delícia e não tem glúten! Perfeito para quem tem intolerâncias.",
                rating: 5,
                photoUrls: ["https://images.unsplash.com/photo-1595295333158-4742f28fbc85?w=600&h=400&fit=crop"],
                createdAt: new Date()
            }
        ];

        await db.collection("visits").insertMany(visits);
        console.log(`Inserted ${visits.length} visits with photos`);

        // ── Create indexes ──
        await db.collection("users").createIndex({ email: 1 }, { unique: true, name: "idx_users_email" });
        await db.collection("establishments").createIndex({ "location.coordinates": "2dsphere" }, { name: "idx_establishments_geo" });
        await db.collection("establishments").createIndex({ flags: 1 }, { name: "idx_establishments_flags" });
        await db.collection("establishments").createIndex({ companyName: "text" }, { name: "idx_establishments_text" });
        await db.collection("establishments").createIndex({ isSponsored: 1, rating: -1 }, { name: "idx_establishments_sponsored" });
        await db.collection("visits").createIndex({ userId: 1, date: -1 }, { name: "idx_visits_user" });
        await db.collection("visits").createIndex({ establishmentId: 1, date: -1 }, { name: "idx_visits_establishment" });
        await db.collection("flags").createIndex({ type: 1 }, { name: "idx_flags_type" });
        console.log("Created indexes");

        console.log("\n✅ Seed completed successfully!");
        console.log(`\n📋 Test credentials:`);
        console.log(`   joao@teste.com / teste123`);
        console.log(`   maria@teste.com / teste123`);

    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

seed();
