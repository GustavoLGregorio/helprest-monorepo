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

        // ── Create indexes ──
        await db.collection("users").createIndex({ email: 1 }, { unique: true });
        await db.collection("establishments").createIndex({ "location.coordinates": "2dsphere" });
        await db.collection("establishments").createIndex({ flags: 1 });
        await db.collection("establishments").createIndex({ companyName: "text" });
        await db.collection("establishments").createIndex({ isSponsored: 1, rating: -1 });
        await db.collection("visits").createIndex({ userId: 1, date: -1 });
        await db.collection("visits").createIndex({ establishmentId: 1, date: -1 });
        await db.collection("flags").createIndex({ type: 1 });
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
