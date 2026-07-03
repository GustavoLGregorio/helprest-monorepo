import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { connectToDatabase, disconnectDatabase, getDatabase } from "@infra/database/mongodb/connection";
import { handleRequest } from "@interface/http/router";
import { generateTokens } from "@infra/security/jwt";
import { ObjectId } from "mongodb";

describe("Product Management Integration Tests", () => {
    let db: any;
    let adminToken: string;
    let otherAdminToken: string;
    let userToken: string;

    const adminId = new ObjectId();
    const otherAdminId = new ObjectId();
    const userId = new ObjectId();
    
    let establishmentId: string;
    let productId: string;

    beforeAll(async () => {
        db = await connectToDatabase();
        
        // Generate auth tokens for testing
        const adminTokens = await generateTokens({ sub: adminId.toHexString(), email: "admin@helprest.com" });
        adminToken = adminTokens.accessToken;

        const otherAdminTokens = await generateTokens({ sub: otherAdminId.toHexString(), email: "other@helprest.com" });
        otherAdminToken = otherAdminTokens.accessToken;

        const userTokens = await generateTokens({ sub: userId.toHexString(), email: "user@helprest.com" });
        userToken = userTokens.accessToken;
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    beforeEach(async () => {
        // Clear collections and set up base data
        await db.collection("establishments").deleteMany({});
        await db.collection("products").deleteMany({});
        await db.collection("users").deleteMany({});

        // Create establishment owned by adminId
        const establishment = {
            _id: new ObjectId(),
            companyName: "Test Burger Shop",
            location: {
                state: "PR",
                city: "Curitiba",
                neighborhood: "Centro",
                address: "Rua das Flores, 100",
                coordinates: { type: "Point", coordinates: [-49.2699, -25.4296] }
            },
            flags: [],
            logo: "https://shop.com/logo.png",
            rating: 4.5,
            ratingCount: 1,
            ratingTotal: 4.5,
            adminId: adminId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.collection("establishments").insertOne(establishment);
        establishmentId = establishment._id.toHexString();

        // Create a product for the establishment
        const product = {
            _id: new ObjectId(),
            establishmentId: establishment._id,
            name: "Cheese Burger",
            description: "Delicious cheeseburger",
            price: 25.90,
            imageUrl: "https://shop.com/burger.png",
            ingredients: ["bread", "cheese", "beef"],
            flags: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.collection("products").insertOne(product);
        productId = product._id.toHexString();
    });

    it("should allow establishment admin to create a new product", async () => {
        const body = {
            establishmentId,
            name: "Veggie Burger",
            description: "Healthy plant-based burger",
            price: 29.90,
            imageUrl: "https://shop.com/veggie.png",
            ingredients: ["bread", "chickpeas patty", "lettuce"],
            flags: []
        };

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(201);
        
        const data = await res.json() as { id: string };
        expect(data.id).toBeDefined();

        // Verify product is in database
        const saved = await db.collection("products").findOne({ _id: new ObjectId(data.id) });
        expect(saved).not.toBeNull();
        expect(saved.name).toBe("Veggie Burger");
    });

    it("should reject product creation from unauthorized users", async () => {
        const body = {
            establishmentId,
            name: "Forbidden Pizza",
            price: 45.00
        };

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(403);
    });

    it("should reject product creation from another establishment's admin", async () => {
        const body = {
            establishmentId,
            name: "Other Admin Burger",
            price: 12.00
        };

        const req = new Request("http://localhost/api/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${otherAdminToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(403);
    });

    it("should allow establishment admin to update product description, price, and active toggle", async () => {
        const updateBody = {
            description: "Cheeseburger with premium cheddar cheese",
            price: 27.90,
            isActive: false
        };

        const req = new Request(`http://localhost/api/products/${productId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(updateBody)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(200);

        const saved = await db.collection("products").findOne({ _id: new ObjectId(productId) });
        expect(saved.description).toBe("Cheeseburger with premium cheddar cheese");
        expect(saved.price).toBe(27.90);
        expect(saved.isActive).toBe(false);
    });

    it("should reject product updates from unauthorized admins", async () => {
        const updateBody = {
            price: 1.00
        };

        const req = new Request(`http://localhost/api/products/${productId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${otherAdminToken}`
            },
            body: JSON.stringify(updateBody)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(403);
    });

    it("should allow establishment admin to delete a product", async () => {
        const req = new Request(`http://localhost/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(200);

        const saved = await db.collection("products").findOne({ _id: new ObjectId(productId) });
        expect(saved).toBeNull();
    });

    it("should reject product deletion from unauthorized users", async () => {
        const req = new Request(`http://localhost/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(403);
    });
});
