import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { createAuthModule } from "../../../../src/interface/modules/auth.module";
import type { IUserRepository } from "../../../../src/domain/repositories/IUserRepository";
import { User } from "../../../../src/domain/entities/User";
import { Elysia } from "elysia";

describe("authModule Suite (ElysiaJS)", () => {
    const mockUser = User.create({
        name: "Google Tester",
        email: "tester@gmail.com",
        authProvider: "google",
        googleId: "google-id-12345",
        flags: [],
        socialLinksEnabled: false,
    });

    const mockUserRepo: IUserRepository = {
        findById: mock(async () => mockUser),
        findByEmail: mock(async () => mockUser),
        findByGoogleId: mock(async () => mockUser),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
    };

    const app = new Elysia()
        .use(errorPlugin)
        .use(createAuthModule(mockUserRepo));

    it("should return 400 Validation Error when googleIdToken is missing or empty", async () => {
        const res = await app.handle(
            new Request("http://localhost/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ googleIdToken: "" }),
            })
        );
        expect(res.status).toBe(400);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.error).toBe("ValidationError");
    });

    it("should return 400 Validation Error when refreshToken is missing or empty", async () => {
        const res = await app.handle(
            new Request("http://localhost/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: "" }),
            })
        );
        expect(res.status).toBe(400);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.error).toBe("ValidationError");
    });
});
