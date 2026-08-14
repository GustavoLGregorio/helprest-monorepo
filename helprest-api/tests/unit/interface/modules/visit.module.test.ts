import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createVisitModule } from "../../../../src/interface/modules/visit.module";
import type { IVisitRepository } from "../../../../src/domain/repositories/IVisitRepository";
import type { IEstablishmentRepository } from "../../../../src/domain/repositories/IEstablishmentRepository";
import type { IUserRepository } from "../../../../src/domain/repositories/IUserRepository";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import { Visit } from "../../../../src/domain/entities/Visit";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Location } from "../../../../src/domain/value-objects/Location";
import { User } from "../../../../src/domain/entities/User";
import { Flag } from "../../../../src/domain/entities/Flag";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("visitModule Suite (ElysiaJS)", () => {
    const userId = new ObjectId();
    const estId = new ObjectId();
    const visitId = new ObjectId();
    const flagId = new ObjectId();

    const mockLocation = Location.create({
        state: "PR",
        city: "Curitiba",
        neighborhood: "Centro",
        address: "Rua XV, 100",
        coordinates: { lat: -25.4284, lng: -49.2733 },
    });

    const mockEstablishment = Establishment.create({
        id: estId,
        companyName: "Restaurante Verde",
        location: mockLocation,
        flags: [flagId],
        logo: "https://example.com/logo.png",
        rating: 4.5,
        ratingCount: 10,
        ratingTotal: 45,
    });

    const mockVisit = Visit.create({
        id: visitId,
        establishmentId: estId,
        userId,
        date: new Date(),
        review: "Excelente comida vegana!",
        rating: 5,
        photoUrls: ["https://example.com/prato.jpg"],
    });

    const mockUser = User.create({
        id: userId,
        name: "User Tester",
        email: "user@tester.com",
        authProvider: "google",
        googleId: "google-123",
        flags: [flagId],
        socialLinksEnabled: false,
    });

    const mockFlag = Flag.create({
        id: flagId,
        type: "dietary",
        identifier: "vegan",
        description: "Vegano",
        tag: "Vegano",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
    });

    const mockVisitRepo: IVisitRepository = {
        findById: mock(async () => mockVisit),
        findByUserId: mock(async () => [mockVisit]),
        findByEstablishmentId: mock(async () => [mockVisit]),
        findRecentWithPhotos: mock(async () => [mockVisit]),
        create: mock(async () => {}),
        delete: mock(async () => {}),
        countByEstablishment: mock(async () => 1),
        count: mock(async () => 1),
    };

    const mockEstRepo: IEstablishmentRepository = {
        findById: mock(async () => mockEstablishment),
        findByAdminId: mock(async () => mockEstablishment),
        findAll: mock(async () => [mockEstablishment]),
        findManyByIds: mock(async () => [mockEstablishment]),
        findNearby: mock(async () => [mockEstablishment]),
        findByFlags: mock(async () => [mockEstablishment]),
        search: mock(async () => [mockEstablishment]),
        findSponsored: mock(async () => [mockEstablishment]),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 1),
        findTopRated: mock(async () => [mockEstablishment]),
    };

    const mockUserRepo: IUserRepository = {
        findById: mock(async () => mockUser),
        findByEmail: mock(async () => mockUser),
        findByGoogleId: mock(async () => mockUser),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 1),
        getFlagDistribution: mock(async () => []),
    };

    const mockFlagRepo: IFlagRepository = {
        findById: mock(async () => mockFlag),
        findAll: mock(async () => [mockFlag]),
        findByIds: mock(async () => [mockFlag]),
        findByType: mock(async () => [mockFlag]),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        updateOrder: mock(async () => {}),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-user-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: userId.toHexString(), email: "user@tester.com", role: "user" });
        })
        .use(errorPlugin)
        .use(createVisitModule(mockVisitRepo, mockEstRepo, mockUserRepo, mockFlagRepo));

    it("should return 401 Unauthorized for POST /api/visits without Bearer token", async () => {
        const res = await testApp.handle(
            new Request("http://localhost/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    establishmentId: estId.toHexString(),
                    rating: 5,
                    review: "Muito bom",
                }),
            })
        );
        expect(res.status).toBe(401);
    });

    it("should create visit with 201 when authenticated", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/visits", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    establishmentId: estId.toHexString(),
                    rating: 5,
                    review: "Adorei a comida!",
                }),
            })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe("string");
    });

    it("should return user visits for GET /api/visits/user/:userId", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/visits/user/${userId.toHexString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as Array<{ id: string; review: string }>;
        expect(body.length).toBe(1);
        expect(body[0]!.review).toBe("Excelente comida vegana!");
    });

    it("should return establishment visits for GET /api/visits/establishment/:id", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/visits/establishment/${estId.toHexString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as Array<{ id: string; rating: number }>;
        expect(body.length).toBe(1);
        expect(body[0]!.rating).toBe(5);
    });

    it("should return social feed for GET /api/social/feed", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/social/feed?lat=-25.4284&lng=-49.2733&page=1&limit=10", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as unknown[];
        expect(Array.isArray(body)).toBe(true);
    });
});
