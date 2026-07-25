import { Elysia, t } from "elysia";
import { GoogleAuthUser } from "@application/use-cases/auth/GoogleAuthUser";
import { RefreshToken } from "@application/use-cases/auth/index";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";

export const createAuthModule = (userRepo: IUserRepository = new MongoUserRepository()) => {
    const googleAuthUseCase = new GoogleAuthUser(userRepo);
    const refreshTokenUseCase = new RefreshToken(userRepo);

    return new Elysia({ prefix: "/api/auth", name: "auth-module" })
        .post(
            "/google",
            async ({ body }) => {
                const result = await googleAuthUseCase.execute(body);
                return result;
            },
            {
                body: t.Object({
                    googleIdToken: t.String({ minLength: 1 }),
                }),
                detail: {
                    summary: "Google OAuth Authentication",
                    tags: ["Auth"],
                },
            }
        )
        .post(
            "/refresh",
            async ({ body }) => {
                const tokens = await refreshTokenUseCase.execute(body.refreshToken);
                return tokens;
            },
            {
                body: t.Object({
                    refreshToken: t.String({ minLength: 1 }),
                }),
                detail: {
                    summary: "Refresh Access Token",
                    tags: ["Auth"],
                },
            }
        );
};

export const authModule = createAuthModule();
