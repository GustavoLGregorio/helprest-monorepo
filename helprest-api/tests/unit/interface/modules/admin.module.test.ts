import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createAdminModule } from "../../../../src/interface/modules/admin.module";
import type { IUserRepository } from "../../../../src/domain/repositories/IUserRepository";
import type { IEstablishmentRepository } from "../../../../src/domain/repositories/IEstablishmentRepository";
import type { IVisitRepository } from "../../../../src/domain/repositories/IVisitRepository";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import type { IUserFavoriteRepository } from "../../../../src/domain/repositories/IUserFavoriteRepository";
import { Flag } from "../../../../src/domain/entities/Flag";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Visit } from "../../../../src/domain/entities/Visit";
import { User } from "../../../../src/domain/entities/User";
import { UserFavorite } from "../../../../src/domain/entities/UserFavorite";
import { Location } from "../../../../src/domain/value-objects/Location";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("adminModule Suite (ElysiaJS)", () => {
    const adminId = new ObjectId();
    const targetUserId = new ObjectId();
    const flagId = new ObjectId();
    const estId = new ObjectId();
    const visitId = new ObjectId();

    const mockFlag = Flag.create({
        id: flagId,
        type: "dietary",
        identifier: "vegan",
        description: "Vegano",
        tag: "Vegano",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
    });

    const mockEstablishment = Establishment.create({
        id: estId,
        companyName: "Restaurante Verde",
        location: Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Centro",
            address: "Rua XV, 100",
            coordinates: { lat: -25.4284, lng: -49.2733 },
        }),
        flags: [flagId],
        logo: "https://example.com/logo.png",
        rating: 4.9,
        ratingCount: 20,
        ratingTotal: 98,
    });

    const mockTargetUser = User.create({
        id: targetUserId,
        name: "Target User",
        email: "target@user.com",
        authProvider: "google",
        googleId: "google-target-123",
        flags: [flagId],
        socialLinksEnabled: false,
    });

    const mockVisit = Visit.create({
        id: visitId,
        establishmentId: estId,
        userId: targetUserId,
        date: new Date(),
        review: "Review sob análise",
        rating: 1,
    });

    const mockFavorite = UserFavorite.create({
        userId: targetUserId,
        referenceId: estId,
        type: "establishment",
    });

    const mockUserRepo: IUserRepository = {
        findById: mock(async (id: ObjectId) => {
            if (id.equals(targetUserId)) return mockTargetUser;
            return null;
        }),
        findByEmail: mock(async () => null),
        findByGoogleId: mock(async () => null),
        findAll: mock(async () => ({ users: [mockTargetUser], total: 1 })),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 500),
        getFlagDistribution: mock(async () => [{ flagId, count: 80 }]),
    };

    const mockEstRepo: IEstablishmentRepository = {
        findById: mock(async () => mockEstablishment),
        findByAdminId: mock(async () => mockEstablishment),
        findAll: mock(async () => []),
        findManyByIds: mock(async () => [mockEstablishment]),
        findNearby: mock(async () => []),
        findByFlags: mock(async () => []),
        search: mock(async () => []),
        findSponsored: mock(async () => []),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 25),
        findTopRated: mock(async () => [mockEstablishment]),
    };

    const mockVisitRepo: IVisitRepository = {
        findById: mock(async () => mockVisit),
        findByUserId: mock(async () => [mockVisit]),
        findByEstablishmentId: mock(async () => []),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        countByEstablishment: mock(async () => 0),
        count: mock(async () => 1200),
        findRecentWithPhotos: mock(async () => []),
        findReported: mock(async () => [mockVisit]),
        moderate: mock(async () => {}),
        addReport: mock(async () => {}),
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

    const mockFavoriteRepo: IUserFavoriteRepository = {
        add: mock(async () => {}),
        remove: mock(async () => {}),
        findByUserAndType: mock(async () => [mockFavorite]),
        findByUser: mock(async () => [mockFavorite]),
        exists: mock(async () => true),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-token", async ({ jwtService, query }) => {
            const role = query.role || "user";
            return jwtService.sign({ sub: adminId.toHexString(), email: "admin@helprest.com", role });
        })
        .use(errorPlugin)
        .use(createAdminModule(mockUserRepo, mockEstRepo, mockVisitRepo, mockFlagRepo, mockFavoriteRepo));

    it("should return 401 Unauthorized for GET /api/admin/dashboard without Bearer token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/admin/dashboard"));
        expect(res.status).toBe(401);
    });

    it("should return 403 Forbidden for GET /api/admin/dashboard with role 'user'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=user"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/admin/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(403);
    });

    it("should return 200 OK and metrics for GET /api/admin/dashboard with role 'admin'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/admin/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const data = (await res.json()) as {
            overview: { totalUsers: number; totalEstablishments: number; totalVisits: number };
            flagDistribution: Array<{ flagId: string; tag: string; count: number }>;
            topRatedEstablishments: Array<{ id: string; companyName: string }>;
        };
        expect(data.overview.totalUsers).toBe(500);
        expect(data.overview.totalEstablishments).toBe(25);
        expect(data.overview.totalVisits).toBe(1200);
        expect(data.flagDistribution.length).toBe(1);
        expect(data.topRatedEstablishments.length).toBe(1);
    });

    it("should return reported visits for GET /api/admin/visits/reported with role 'admin'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/admin/visits/reported", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const data = (await res.json()) as Array<{ id: string; review: string }>;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(1);
    });

    it("should moderate (hide) a review with 200 for PATCH /api/admin/visits/:id/moderate", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/admin/visits/${visitId.toHexString()}/moderate`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isModerated: true,
                    reason: "Discurso ofensivo",
                }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { success: boolean; isModerated: boolean };
        expect(body.success).toBe(true);
        expect(body.isModerated).toBe(true);
    });

    it("should list users with pagination for GET /api/admin/users", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/admin/users?page=1&limit=10", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { data: Array<{ id: string; name: string }>; pagination: { total: number } };
        expect(body.data.length).toBe(1);
        expect(body.data[0]!.name).toBe("Target User");
        expect(body.pagination.total).toBe(1);
    });

    it("should update user role with 200 for PATCH /api/admin/users/:id/role", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/admin/users/${targetUserId.toHexString()}/role`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role: "establishment_admin" }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { role: string };
        expect(body.role).toBe("establishment_admin");
    });

    it("should ban user with 200 for PATCH /api/admin/users/:id/ban", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/admin/users/${targetUserId.toHexString()}/ban`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isBanned: true, reason: "Spam recorrente" }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { isBanned: boolean; status: string };
        expect(body.isBanned).toBe(true);
        expect(body.status).toBe("banned");
    });

    it("should return user history for GET /api/admin/users/:id/history", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token?role=admin"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/admin/users/${targetUserId.toHexString()}/history`, {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { user: { name: string }; visits: unknown[]; favorites: unknown[] };
        expect(body.user.name).toBe("Target User");
        expect(body.visits.length).toBe(1);
        expect(body.favorites.length).toBe(1);
    });
});
