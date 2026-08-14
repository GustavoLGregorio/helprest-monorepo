import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { AddFavorite } from "@application/use-cases/favorite/AddFavorite";
import { RemoveFavorite } from "@application/use-cases/favorite/RemoveFavorite";
import { GetUserFavorites } from "@application/use-cases/favorite/GetUserFavorites";
import { MongoUserFavoriteRepository } from "@infra/repositories/MongoUserFavoriteRepository";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import { MongoProductRepository } from "@infra/repositories/MongoProductRepository";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import type { IUserFavoriteRepository } from "@domain/repositories/IUserFavoriteRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import { UnauthorizedError } from "@shared/errors";

export const createFavoriteModule = (
    favoriteRepo: IUserFavoriteRepository = new MongoUserFavoriteRepository(),
    estRepo: IEstablishmentRepository = new MongoEstablishmentRepository(),
    productRepo: ProductRepository = new MongoProductRepository(),
    userRepo: IUserRepository = new MongoUserRepository(),
    flagRepo: IFlagRepository = new MongoFlagRepository()
) => {
    const addFavoriteUseCase = new AddFavorite(favoriteRepo);
    const removeFavoriteUseCase = new RemoveFavorite(favoriteRepo);
    const getUserFavoritesUseCase = new GetUserFavorites(favoriteRepo, estRepo, productRepo, userRepo, flagRepo);

    return new Elysia({ prefix: "/api/favorites", name: "favorite-module" })
        .use(authPlugin)
        .get(
            "",
            async ({ user }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                return await getUserFavoritesUseCase.execute(user.sub);
            },
            {
                role: "user",
                detail: {
                    summary: "Get User Favorited Establishments and Products",
                    tags: ["Favorites"],
                },
            }
        )
        .post(
            "",
            async ({ user, body, set }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                await addFavoriteUseCase.execute(
                    user.sub,
                    body.referenceId,
                    body.type as "establishment" | "product"
                );
                set.status = 201;
                return { success: true };
            },
            {
                role: "user",
                body: t.Object({
                    referenceId: t.String({ minLength: 24, maxLength: 24 }),
                    type: t.Union([t.Literal("establishment"), t.Literal("product")]),
                }),
                detail: {
                    summary: "Add Establishment or Product to Favorites",
                    tags: ["Favorites"],
                },
            }
        )
        .delete(
            "/:id",
            async ({ user, params }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                await removeFavoriteUseCase.execute(user.sub, params.id);
                return { success: true };
            },
            {
                role: "user",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                detail: {
                    summary: "Remove Establishment or Product from Favorites",
                    tags: ["Favorites"],
                },
            }
        );
};

export const favoriteModule = createFavoriteModule();
