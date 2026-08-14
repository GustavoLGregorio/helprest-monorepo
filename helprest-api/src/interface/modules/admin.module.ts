import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { GetAdminDashboardMetrics } from "@application/use-cases/admin/GetAdminDashboardMetrics";
import { ListReportedVisits } from "@application/use-cases/admin/ListReportedVisits";
import { ModerateVisit } from "@application/use-cases/admin/ModerateVisit";
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import { MongoVisitRepository } from "@infra/repositories/MongoVisitRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";

export const createAdminModule = (
    userRepo: IUserRepository = new MongoUserRepository(),
    establishmentRepo: IEstablishmentRepository = new MongoEstablishmentRepository(),
    visitRepo: IVisitRepository = new MongoVisitRepository(),
    flagRepo: IFlagRepository = new MongoFlagRepository()
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
        );
};

export const adminModule = createAdminModule();
