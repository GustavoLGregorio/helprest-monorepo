import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { GetAdminDashboardMetrics } from "@application/use-cases/admin/GetAdminDashboardMetrics";
import { ListReportedVisits } from "@application/use-cases/admin/ListReportedVisits";
import { ModerateVisit } from "@application/use-cases/admin/ModerateVisit";
import { ListUsers } from "@application/use-cases/admin/ListUsers";
import { UpdateUserRole } from "@application/use-cases/admin/UpdateUserRole";
import { BanUser } from "@application/use-cases/admin/BanUser";
import { GetUserHistory } from "@application/use-cases/admin/GetUserHistory";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import { MongoVisitRepository } from "@infra/repositories/MongoVisitRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import { MongoUserFavoriteRepository } from "@infra/repositories/MongoUserFavoriteRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { IUserFavoriteRepository } from "@domain/repositories/IUserFavoriteRepository";

export const createAdminModule = (
    userRepo: IUserRepository = new MongoUserRepository(),
    establishmentRepo: IEstablishmentRepository = new MongoEstablishmentRepository(),
    visitRepo: IVisitRepository = new MongoVisitRepository(),
    flagRepo: IFlagRepository = new MongoFlagRepository(),
    favoriteRepo: IUserFavoriteRepository = new MongoUserFavoriteRepository()
) => {
    const getDashboardMetricsUseCase = new GetAdminDashboardMetrics(
        userRepo,
        establishmentRepo,
        visitRepo,
        flagRepo
    );
    const listReportedVisitsUseCase = new ListReportedVisits(
        visitRepo,
        userRepo,
        establishmentRepo
    );
    const moderateVisitUseCase = new ModerateVisit(visitRepo);
    const listUsersUseCase = new ListUsers(userRepo);
    const updateUserRoleUseCase = new UpdateUserRole(userRepo);
    const banUserUseCase = new BanUser(userRepo);
    const getUserHistoryUseCase = new GetUserHistory(
        userRepo,
        visitRepo,
        favoriteRepo,
        establishmentRepo
    );

    return new Elysia({ prefix: "/api/admin", name: "admin-module" })
        .use(authPlugin)
        .get(
            "/dashboard",
            async () => {
                return await getDashboardMetricsUseCase.execute();
            },
            {
                role: "admin",
                detail: {
                    summary: "Get Administrative Dashboard Metrics & Analytics",
                    tags: ["Admin"],
                },
            }
        )
        .get(
            "/visits/reported",
            async ({ query }) => {
                const limit = query.limit ? Number(query.limit) : 20;
                const skip = query.skip ? Number(query.skip) : 0;
                return await listReportedVisitsUseCase.execute(limit, skip);
            },
            {
                role: "admin",
                query: t.Object({
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
                    skip: t.Optional(t.Numeric({ minimum: 0 })),
                }),
                detail: {
                    summary: "List Reported Visits and Reviews for Content Moderation",
                    tags: ["Admin"],
                },
            }
        )
        .patch(
            "/visits/:id/moderate",
            async ({ params, body }) => {
                return await moderateVisitUseCase.execute({
                    visitId: params.id,
                    isModerated: body.isModerated,
                    reason: body.reason,
                });
            },
            {
                role: "admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                body: t.Object({
                    isModerated: t.Boolean(),
                    reason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
                }),
                detail: {
                    summary: "Moderate (Hide or Unhide) a Visit/Review",
                    tags: ["Admin"],
                },
            }
        )
        .get(
            "/users",
            async ({ query }) => {
                const page = query.page ? Number(query.page) : 1;
                const limit = query.limit ? Number(query.limit) : 20;
                return await listUsersUseCase.execute({
                    query: query.query,
                    role: query.role,
                    status: query.status,
                    page,
                    limit,
                });
            },
            {
                role: "admin",
                query: t.Object({
                    query: t.Optional(t.String()),
                    role: t.Optional(t.String()),
                    status: t.Optional(t.String()),
                    page: t.Optional(t.Numeric({ minimum: 1 })),
                    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
                }),
                detail: {
                    summary: "List and Search Users with Filtering and Pagination",
                    tags: ["Admin"],
                },
            }
        )
        .patch(
            "/users/:id/role",
            async ({ params, body }) => {
                return await updateUserRoleUseCase.execute({
                    userId: params.id,
                    newRole: body.role,
                });
            },
            {
                role: "admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                body: t.Object({
                    role: t.Union([
                        t.Literal("user"),
                        t.Literal("establishment_admin"),
                        t.Literal("admin"),
                        t.Literal("superadmin"),
                    ]),
                }),
                detail: {
                    summary: "Update User Role & Access Privileges",
                    tags: ["Admin"],
                },
            }
        )
        .patch(
            "/users/:id/ban",
            async ({ params, body }) => {
                return await banUserUseCase.execute({
                    userId: params.id,
                    isBanned: body.isBanned,
                    reason: body.reason,
                });
            },
            {
                role: "admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                body: t.Object({
                    isBanned: t.Boolean(),
                    reason: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
                }),
                detail: {
                    summary: "Ban or Unban User Account",
                    tags: ["Admin"],
                },
            }
        )
        .get(
            "/users/:id/history",
            async ({ params }) => {
                return await getUserHistoryUseCase.execute(params.id);
            },
            {
                role: "admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                detail: {
                    summary: "Get Complete User Profile, Visits, and Favorites History",
                    tags: ["Admin"],
                },
            }
        );
};

export const adminModule = createAdminModule();
