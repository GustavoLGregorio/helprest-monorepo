import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createEstablishmentModule } from "../../../../src/interface/modules/establishment.module";
import type { IEstablishmentRepository } from "../../../../src/domain/repositories/IEstablishmentRepository";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import type { IUserRepository } from "../../../../src/domain/repositories/IUserRepository";
import type { ProductRepository } from "../../../../src/application/repositories/ProductRepository";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Location } from "../../../../src/domain/value-objects/Location";
import { Flag } from "../../../../src/domain/entities/Flag";
import { User } from "../../../../src/domain/entities/User";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("establishmentModule Suite (ElysiaJS)", () => {
    const userId = new ObjectId();
    const adminId = new ObjectId();
    const estId = new ObjectId();
    const flagId = new ObjectId();

    const mockLocation = Location.create({
        state: "PR",
        city: "Curitiba",
        neighborhood: "Centro",
        address: "Rua XV de Novembro, 100",
        coordinates: { lat: -25.4284, lng: -49.2733 },
    });

    const mockEstablishment = Establishment.create({
        id: estId,
        companyName: "Restaurante Verde Vida",
        location: mockLocation,
        flags: [flagId],
        logo: "https://example.com/logo.png",
        rating: 0,
        ratingCount: 0,
        ratingTotal: 0,
        adminId,
    });

    const mockFlag = Flag.create({
        id: flagId,
        type: "dietary",
        identifier: "vegan",
        description: "Alimentos 100% veganos",
        tag: "Vegano",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
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

    const mockEstRepo: IEstablishmentRepository = {
        findById: mock(async (id: ObjectId) => {
            if (id.equals(estId)) return mockEstablishment;
            return null;
        }),
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

    const mockProductRepo: ProductRepository = {
        save: mock(async () => {}),
        findById: mock(async () => null),
        findManyByIds: mock(async () => []),
        findByEstablishmentId: mock(async () => []),
        delete: mock(async () => {}),
    };

    const mockUserRepo: IUserRepository = {
        findById: mock(async () => mockUser),
        findByEmail: mock(async () => mockUser),
        findByGoogleId: mock(async () => mockUser),
        findAll: mock(async () => ({ users: [mockUser], total: 1 })),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 1),
        getFlagDistribution: mock(async () => []),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-user-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: userId.toHexString(), email: "user@tester.com", role: "user" });
        })
        .get("/sign-admin-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: adminId.toHexString(), email: "admin@tester.com", role: "establishment_admin" });
        })
        .use(errorPlugin)
        .use(createEstablishmentModule(mockEstRepo, mockFlagRepo, mockProductRepo, mockUserRepo));

    it("should return 401 Unauthorized for GET /api/establishments without token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/establishments"));
        expect(res.status).toBe(401);
    });

    it("should return establishments paginated list for GET /api/establishments with valid token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments?page=1&limit=10", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { data: unknown[]; pagination: { total: number } };
        expect(body.data.length).toBe(1);
        expect(body.pagination.total).toBe(1);
    });

    it("should return establishment detail for GET /api/establishments/:id", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/establishments/${estId.toHexString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { id: string; companyName: string };
        expect(body.id).toBe(estId.toHexString());
        expect(body.companyName).toBe("Restaurante Verde Vida");
    });

    it("should return recommended establishments for GET /api/establishments/recommended", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments/recommended?lat=-25.4284&lng=-49.2733&limit=5", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as unknown[];
        expect(Array.isArray(body)).toBe(true);
    });

    it("should return nearby establishments for GET /api/establishments/nearby", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments/nearby?lat=-25.4284&lng=-49.2733&maxDistance=5000", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as unknown[];
        expect(Array.isArray(body)).toBe(true);
    });

    it("should search establishments for GET /api/establishments/search", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments/search?q=verde&page=1&limit=10", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as unknown[];
        expect(Array.isArray(body)).toBe(true);
    });

    it("should reject GET /api/establishments/my-establishment with 403 when role is 'user'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments/my-establishment", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(403);
    });

    it("should allow GET /api/establishments/my-establishment when role is 'establishment_admin'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments/my-establishment", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { id: string; companyName: string };
        expect(body.id).toBe(estId.toHexString());
    });

    it("should create an establishment with POST /api/establishments for establishment_admin", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/establishments", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    companyName: "Novo Bistro Vegano",
                    location: {
                        state: "PR",
                        city: "Curitiba",
                        neighborhood: "Batel",
                        address: "Av. Batel, 500",
                        coordinates: { lat: -25.44, lng: -49.28 },
                    },
                    flagIds: [flagId.toHexString()],
                    logo: "https://example.com/logo.png",
                }),
            })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe("string");
    });
});
