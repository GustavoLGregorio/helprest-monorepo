import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { connectToDatabase, disconnectDatabase, getDatabase } from "@infra/database/mongodb/connection";
import { handleRequest } from "@interface/http/router";
import { generateTokens } from "@infra/security/jwt";
import { ObjectId } from "mongodb";

describe("Geofencing Visit Integration Tests", () => {
    let db: any;
    let userToken: string;

    const userId = new ObjectId();
    let establishmentId: string;
    
    // Establishment coordinate (Curitiba Centro)
    const estLat = -25.4296;
    const estLng = -49.2699;

    beforeAll(async () => {
        db = await connectToDatabase();
        
        // Generate auth tokens for testing
        const userTokens = await generateTokens({ sub: userId.toHexString(), email: "tester@helprest.com" });
        userToken = userTokens.accessToken;
    });

    afterAll(async () => {
        await disconnectDatabase();
    });

    beforeEach(async () => {
        await db.collection("establishments").deleteMany({});
        await db.collection("visits").deleteMany({});

        // Create establishment with exact coordinates
        const establishment = {
            _id: new ObjectId(),
            companyName: "Geofenced Grill",
            location: {
                state: "PR",
                city: "Curitiba",
                neighborhood: "Centro",
                address: "Rua XV de Novembro, 100",
                coordinates: { type: "Point", coordinates: [estLng, estLat] }
            },
            flags: [],
            logo: "https://shop.com/logo.png",
            rating: 5.0,
            ratingCount: 1,
            ratingTotal: 5.0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.collection("establishments").insertOne(establishment);
        establishmentId = establishment._id.toHexString();
    });

    it("should allow registering a visit with a photo if user is within 100m radius", async () => {
        // Coordinate about 50m away from the establishment
        const userLat = -25.4293;
        const userLng = -49.2695;

        const body = {
            establishmentId,
            rating: 5,
            review: "Amazing burger! Highly recommended.",
            photoUrls: ["https://picsum.photos/200"],
            coordinates: {
                lat: userLat,
                lng: userLng
            }
        };

        const req = new Request("http://localhost/api/visits", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(201);

        const data = await res.json() as { id: string };
        expect(data.id).toBeDefined();

        // Check visit was saved
        const savedVisit = await db.collection("visits").findOne({ _id: new ObjectId(data.id) });
        expect(savedVisit).not.toBeNull();
        expect(savedVisit.photoUrls).toHaveLength(1);
    });

    it("should reject visit registration with photo if user coordinates are > 100m away", async () => {
        // Coordinate about 400m away from the establishment
        const userLat = -25.4332;
        const userLng = -49.2699;

        const body = {
            establishmentId,
            rating: 4,
            review: "Review from too far away",
            photoUrls: ["https://picsum.photos/200"],
            coordinates: {
                lat: userLat,
                lng: userLng
            }
        };

        const req = new Request("http://localhost/api/visits", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(400);

        const data = await res.json() as { error: string; message: string };
        expect(data.error).toBe("ValidationError");
        expect(data.message).toContain("menos de 100 metros");
    });

    it("should reject visit registration with photo if user coordinates are missing", async () => {
        const body = {
            establishmentId,
            rating: 4,
            review: "Review with photo but no coordinates",
            photoUrls: ["https://picsum.photos/200"]
        };

        const req = new Request("http://localhost/api/visits", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(400);

        const data = await res.json() as { error: string; message: string };
        expect(data.error).toBe("ValidationError");
        expect(data.message).toContain("Coordenadas de geolocalização são obrigatórias");
    });

    it("should allow registering a visit WITHOUT photo even if user coordinates are missing or far away", async () => {
        const body = {
            establishmentId,
            rating: 5,
            review: "Delicious review written from home without photos!"
        };

        const req = new Request("http://localhost/api/visits", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(body)
        });

        const res = await handleRequest(req);
        expect(res.status).toBe(201);

        const data = await res.json() as { id: string };
        expect(data.id).toBeDefined();

        const savedVisit = await db.collection("visits").findOne({ _id: new ObjectId(data.id) });
        expect(savedVisit).not.toBeNull();
        expect(savedVisit.photoUrls).toHaveLength(0);
    });
});
