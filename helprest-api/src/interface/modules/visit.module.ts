import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { CreateVisit, ListUserVisits, GetEstablishmentVisits } from "@application/use-cases/visit";
import { GetSocialFeed } from "@application/use-cases/visit/GetSocialFeed";
import { MongoVisitRepository } from "@infra/repositories/MongoVisitRepository";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { CreateVisitInput } from "@interface/validation/visit.schema";
import { UnauthorizedError } from "@shared/errors";

export const createVisitModule = (
    visitRepo: IVisitRepository = new MongoVisitRepository(),
    estRepo: IEstablishmentRepository = new MongoEstablishmentRepository(),
    userRepo: IUserRepository = new MongoUserRepository(),
    flagRepo: IFlagRepository = new MongoFlagRepository()
) => {
    const createVisitUseCase = new CreateVisit(visitRepo, estRepo);
    const listUserVisitsUseCase = new ListUserVisits(visitRepo);
    const getEstablishmentVisitsUseCase = new GetEstablishmentVisits(visitRepo);
    const getSocialFeedUseCase = new GetSocialFeed(visitRepo, estRepo, userRepo, flagRepo);

    return new Elysia({ name: "visit-module" })
        .use(authPlugin)
        .post(
            "/api/visits",
            async ({ user, body, set }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await createVisitUseCase.execute(user.sub, body as CreateVisitInput);
                set.status = 201;
                return result;
            },
            {
                role: "user",
                body: t.Object({
                    establishmentId: t.String({ minLength: 24, maxLength: 24 }),
                    rating: t.Integer({ minimum: 1, maximum: 5 }),
                    review: t.String({ minLength: 1, maxLength: 2000 }),
                    date: t.Optional(t.String()),
                    photoUrls: t.Optional(t.Array(t.String())),
                    coordinates: t.Optional(
                        t.Object({
                            lat: t.Number({ minimum: -90, maximum: 90 }),
                            lng: t.Number({ minimum: -180, maximum: 180 }),
                        })
                    ),
                }),
                detail: {
                    summary: "Create Visit and Review with Geofencing for Photos",
                    tags: ["Visits"],
                },
            }
        )
        .get(
            "/api/visits/user/:userId",
            async ({ params, query }) => {
                const page = query.page ? Number(query.page) : 1;
                const limit = query.limit ? Number(query.limit) : 20;
                return await listUserVisitsUseCase.execute(params.userId, { page, limit });
            },
            {
                role: "user",
                params: t.Object({
                    userId: t.String({ minLength: 24, maxLength: 24 }),
                }),
                query: t.Object({
                    page: t.Optional(t.Numeric({ minimum: 1 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "List User Visit History",
                    tags: ["Visits"],
                },
            }
        )
        .get(
            "/api/visits/establishment/:id",
            async ({ params, query }) => {
                const page = query.page ? Number(query.page) : 1;
                const limit = query.limit ? Number(query.limit) : 20;
                return await getEstablishmentVisitsUseCase.execute(params.id, { page, limit });
            },
            {
                role: "user",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                query: t.Object({
                    page: t.Optional(t.Numeric({ minimum: 1 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "List Establishment Reviews and Visits",
                    tags: ["Visits"],
                },
            }
        )
        .get(
            "/api/social/feed",
            async ({ query }) => {
                const lat = query.lat ? Number(query.lat) : 0;
                const lng = query.lng ? Number(query.lng) : 0;
                const page = query.page ? Number(query.page) : 1;
                const limit = query.limit ? Number(query.limit) : 15;
                return await getSocialFeedUseCase.execute({ lat, lng, page, limit });
            },
            {
                role: "user",
                query: t.Object({
                    lat: t.Optional(t.Numeric({ minimum: -90, maximum: 90 })),
                    lng: t.Optional(t.Numeric({ minimum: -180, maximum: 180 })),
                    page: t.Optional(t.Numeric({ minimum: 1 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                }),
                detail: {
                    summary: "Get Geolocation-Aware Social Activity Feed",
                    tags: ["Social"],
                },
            }
        );
};

export const visitModule = createVisitModule();
