import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import {
    ListEstablishments,
    GetEstablishment,
    GetRecommendedEstablishments,
    GetNearbyEstablishments,
    SearchEstablishments,
    CreateEstablishment,
    GetEstablishmentByAdmin,
} from "@application/use-cases/establishment";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoProductRepository } from "@infra/repositories/MongoProductRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import type { CreateEstablishmentInput } from "@interface/validation/establishment.schema";
import { UnauthorizedError } from "@shared/errors";

export const createEstablishmentModule = (
    estRepo: IEstablishmentRepository = new MongoEstablishmentRepository(),
    flagRepo: IFlagRepository = new MongoFlagRepository(),
    productRepo: ProductRepository = new MongoProductRepository(),
    userRepo: IUserRepository = new MongoUserRepository()
) => {
    const listEstablishmentsUseCase = new ListEstablishments(estRepo, flagRepo);
    const getEstablishmentUseCase = new GetEstablishment(estRepo, flagRepo, productRepo, userRepo);
    const getRecommendedUseCase = new GetRecommendedEstablishments(estRepo, userRepo, flagRepo);
    const getNearbyUseCase = new GetNearbyEstablishments(estRepo, flagRepo);
    const searchEstablishmentsUseCase = new SearchEstablishments(estRepo, flagRepo);
    const createEstablishmentUseCase = new CreateEstablishment(estRepo);
    const getEstablishmentByAdminUseCase = new GetEstablishmentByAdmin(estRepo, flagRepo, productRepo);

    return new Elysia({ prefix: "/api/establishments", name: "establishment-module" })
        .use(authPlugin)
        .get(
            "",
            async ({ query }) => {
                const page = query.page ? Number(query.page) : 1;
                const limit = query.limit ? Number(query.limit) : 20;
                return await listEstablishmentsUseCase.execute({ page, limit });
            },
            {
                role: "user",
                query: t.Object({
                    page: t.Optional(t.Numeric({ minimum: 1 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "List Establishments Paginated",
                    tags: ["Establishments"],
                },
            }
        )
        .get(
            "/recommended",
            async ({ user, query }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const lat = Number(query.lat);
                const lng = Number(query.lng);
                const limit = query.limit ? Number(query.limit) : 20;
                return await getRecommendedUseCase.execute(user.sub, lat, lng, limit);
            },
            {
                role: "user",
                query: t.Object({
                    lat: t.Numeric({ minimum: -90, maximum: 90 }),
                    lng: t.Numeric({ minimum: -180, maximum: 180 }),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "Get Recommended Establishments by User Dietary Flags",
                    tags: ["Establishments"],
                },
            }
        )
        .get(
            "/nearby",
            async ({ query }) => {
                const lat = Number(query.lat);
                const lng = Number(query.lng);
                const maxDistance = query.maxDistance ? Number(query.maxDistance) : 10_000;
                const limit = query.limit ? Number(query.limit) : 20;
                return await getNearbyUseCase.execute({ lat, lng, maxDistance, limit });
            },
            {
                role: "user",
                query: t.Object({
                    lat: t.Numeric({ minimum: -90, maximum: 90 }),
                    lng: t.Numeric({ minimum: -180, maximum: 180 }),
                    maxDistance: t.Optional(t.Numeric({ minimum: 100, maximum: 100_000 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "Get Nearby Establishments by Geospatial Distance",
                    tags: ["Establishments"],
                },
            }
        )
        .get(
            "/search",
            async ({ query }) => {
                const page = query.page ? Number(query.page) : 1;
                const limit = query.limit ? Number(query.limit) : 20;
                return await searchEstablishmentsUseCase.execute({ q: query.q, page, limit });
            },
            {
                role: "user",
                query: t.Object({
                    q: t.String({ minLength: 1, maxLength: 200 }),
                    page: t.Optional(t.Numeric({ minimum: 1 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "Search Establishments by Text",
                    tags: ["Establishments"],
                },
            }
        )
        .get(
            "/my-establishment",
            async ({ user }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                return await getEstablishmentByAdminUseCase.execute(user.sub);
            },
            {
                role: "establishment_admin",
                detail: {
                    summary: "Get Establishment Profile Managed by Admin",
                    tags: ["Establishments"],
                },
            }
        )
        .get(
            "/:id",
            async ({ user, params }) => {
                return await getEstablishmentUseCase.execute(params.id, user?.sub);
            },
            {
                role: "user",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                detail: {
                    summary: "Get Establishment by ID",
                    tags: ["Establishments"],
                },
            }
        )
        .post(
            "",
            async ({ user, body, set }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await createEstablishmentUseCase.execute(user.sub, body as CreateEstablishmentInput);
                set.status = 201;
                return result;
            },
            {
                role: "establishment_admin",
                body: t.Object({
                    companyName: t.String({ minLength: 2, maxLength: 200 }),
                    location: t.Object({
                        state: t.String({ minLength: 1 }),
                        city: t.String({ minLength: 1 }),
                        neighborhood: t.Optional(t.String()),
                        address: t.String({ minLength: 1 }),
                        coordinates: t.Object({
                            lat: t.Number({ minimum: -90, maximum: 90 }),
                            lng: t.Number({ minimum: -180, maximum: 180 }),
                        }),
                    }),
                    flagIds: t.Array(t.String({ minLength: 1 })),
                    logo: t.String(),
                }),
                detail: {
                    summary: "Create New Establishment",
                    tags: ["Establishments"],
                },
            }
        );
};

export const establishmentModule = createEstablishmentModule();
