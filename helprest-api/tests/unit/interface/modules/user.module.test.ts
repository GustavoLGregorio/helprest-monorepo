import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createUserModule } from "../../../../src/interface/modules/user.module";
import type { IUserRepository } from "../../../../src/domain/repositories/IUserRepository";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import { User } from "../../../../src/domain/entities/User";
import { Flag } from "../../../../src/domain/entities/Flag";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("userModule Suite (ElysiaJS)", () => {
    const userId = new ObjectId();
    const flagId = new ObjectId();

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
        identifier: "gluten-free",
        description: "Gluten-Free products",
        tag: "Sem Glúten",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
    });

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
        .get("/sign-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: userId.toHexString(), email: "user@tester.com", role: "user" });
        })
        .use(errorPlugin)
        .use(createUserModule(mockUserRepo, mockFlagRepo));

    it("should return 401 Unauthorized for GET /api/users/me without Bearer token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/users/me"));
        expect(res.status).toBe(401);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.error).toBe("UnauthorizedError");
    });

    it("should return user profile for GET /api/users/me with valid Bearer token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.name).toBe("User Tester");
        expect(body.email).toBe("user@tester.com");
    });

    it("should return 400 Validation Error for PATCH /api/users/me with invalid payload", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/users/me", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: "A" }), // min 2 chars required
            })
        );
        expect(res.status).toBe(400);
    });

    it("should update user profile for PATCH /api/users/me with valid payload", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/users/me", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: "Updated User Tester" }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.success).toBe(true);
    });

    it("should update user dietary flags for PATCH /api/users/me/flags", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/users/me/flags", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ flagIds: [flagId.toHexString()] }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.success).toBe(true);
    });
});
