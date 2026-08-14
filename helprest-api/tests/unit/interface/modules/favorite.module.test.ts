import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createFavoriteModule } from "../../../../src/interface/modules/favorite.module";
import type { IUserFavoriteRepository } from "../../../../src/domain/repositories/IUserFavoriteRepository";
import type { IEstablishmentRepository } from "../../../../src/domain/repositories/IEstablishmentRepository";
import type { ProductRepository } from "../../../../src/application/repositories/ProductRepository";
import type { IUserRepository } from "../../../../src/domain/repositories/IUserRepository";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import { UserFavorite } from "../../../../src/domain/entities/UserFavorite";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Location } from "../../../../src/domain/value-objects/Location";
import { User } from "../../../../src/domain/entities/User";
import { Flag } from "../../../../src/domain/entities/Flag";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("favoriteModule Suite (ElysiaJS)", () => {
    const userId = new ObjectId();
    const estId = new ObjectId();
    const flagId = new ObjectId();
    const favoriteId = new ObjectId();

    const mockFavorite = UserFavorite.create({
        id: favoriteId,
        userId,
        referenceId: estId,
        type: "establishment",
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
        rating: 4.8,
        ratingCount: 15,
        ratingTotal: 72,
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

    const mockFavoriteRepo: IUserFavoriteRepository = {
        add: mock(async () => {}),
        remove: mock(async () => {}),
        findByUserAndType: mock(async () => [mockFavorite]),
        findByUser: mock(async () => [mockFavorite]),
        exists: mock(async () => true),
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
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
    };

    const mockFlagRepo: IFlagRepository = {
        findById: mock(async () => mockFlag),
        findAll: mock(async () => [mockFlag]),
        findByIds: mock(async () => [mockFlag]),
        findByType: mock(async () => [mockFlag]),
        create: mock(async () => {}),
        delete: mock(async () => {}),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-user-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: userId.toHexString(), email: "user@tester.com", role: "user" });
        })
        .use(errorPlugin)
        .use(createFavoriteModule(mockFavoriteRepo, mockEstRepo, mockProductRepo, mockUserRepo, mockFlagRepo));

    it("should return 401 Unauthorized for GET /api/favorites without Bearer token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/favorites"));
        expect(res.status).toBe(401);
    });

    it("should return user favorites for GET /api/favorites with valid Bearer token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/favorites", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { establishments: Array<{ id: string }>; products: unknown[] };
        expect(body.establishments.length).toBe(1);
        expect(body.establishments[0]!.id).toBe(estId.toHexString());
    });

    it("should add favorite with 201 for POST /api/favorites", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/favorites", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    referenceId: estId.toHexString(),
                    type: "establishment",
                }),
            })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as { success: boolean };
        expect(body.success).toBe(true);
    });

    it("should remove favorite with 200 for DELETE /api/favorites/:id", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/favorites/${estId.toHexString()}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { success: boolean };
        expect(body.success).toBe(true);
    });
});
