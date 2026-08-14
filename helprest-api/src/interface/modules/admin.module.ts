import { Elysia } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { GetAdminDashboardMetrics } from "@application/use-cases/admin/GetAdminDashboardMetrics";
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
        );
};

export const adminModule = createAdminModule();
