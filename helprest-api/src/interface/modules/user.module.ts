import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { GetUserProfile, UpdateUserProfile, UpdateUserFlags } from "@application/use-cases/user/index";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { UpdateProfileInput } from "@interface/validation/user.schema";
import { UnauthorizedError } from "@shared/errors";

export const createUserModule = (
    userRepo: IUserRepository = new MongoUserRepository(),
    flagRepo: IFlagRepository = new MongoFlagRepository()
) => {
    const getUserProfileUseCase = new GetUserProfile(userRepo);
    const updateUserProfileUseCase = new UpdateUserProfile(userRepo);
    const updateUserFlagsUseCase = new UpdateUserFlags(userRepo, flagRepo);

    return new Elysia({ prefix: "/api/users", name: "user-module" })
        .use(authPlugin)
        .get(
            "/me",
            async ({ user }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const profile = await getUserProfileUseCase.execute(user.sub);
                return profile;
            },
            {
                role: "user",
                detail: {
                    summary: "Get Current User Profile",
                    tags: ["User"],
                },
            }
        )
        .patch(
            "/me",
            async ({ user, body }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await updateUserProfileUseCase.execute(user.sub, body as UpdateProfileInput);
                return result;
            },
            {
                role: "user",
                body: t.Object({
                    name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
                    birthDate: t.Optional(t.String()),
                    location: t.Optional(
                        t.Object({
                            state: t.Optional(t.String()),
                            city: t.Optional(t.String()),
                            neighborhood: t.Optional(t.String()),
                            address: t.String({ minLength: 1 }),
                            coordinates: t.Optional(
                                t.Object({
                                    lat: t.Number({ minimum: -90, maximum: 90 }),
                                    lng: t.Number({ minimum: -180, maximum: 180 }),
                                })
                            ),
                        })
                    ),
                    socialLinksEnabled: t.Optional(t.Boolean()),
                    socialLinks: t.Optional(
                        t.Object({
                            instagram: t.Optional(t.String()),
                            facebook: t.Optional(t.String()),
                            twitter: t.Optional(t.String()),
                            tiktok: t.Optional(t.String()),
                            website: t.Optional(t.String()),
                        })
                    ),
                    profilePhoto: t.Optional(t.String()),
                    role: t.Optional(t.Union([t.Literal("user"), t.Literal("establishment_admin")])),
                }),
                detail: {
                    summary: "Update Current User Profile",
                    tags: ["User"],
                },
            }
        )
        .patch(
            "/me/flags",
            async ({ user, body }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await updateUserFlagsUseCase.execute(user.sub, body);
                return result;
            },
            {
                role: "user",
                body: t.Object({
                    flagIds: t.Array(t.String({ minLength: 1 })),
                }),
                detail: {
                    summary: "Update User Dietary Restriction Flags",
                    tags: ["User"],
                },
            }
        );
};

export const userModule = createUserModule();
