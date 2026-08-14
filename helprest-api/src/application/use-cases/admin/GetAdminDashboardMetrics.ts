import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";

export interface AdminDashboardMetricsOutput {
    overview: {
        totalUsers: number;
        totalEstablishments: number;
        totalVisits: number;
    };
    flagDistribution: Array<{
        flagId: string;
        tag: string;
        identifier: string;
        count: number;
    }>;
    topRatedEstablishments: Array<{
        id: string;
        companyName: string;
        rating: number;
        ratingCount: number;
        logo: string | null;
    }>;
}

export class GetAdminDashboardMetrics {
    constructor(
        private userRepo: IUserRepository,
        private establishmentRepo: IEstablishmentRepository,
        private visitRepo: IVisitRepository,
        private flagRepo: IFlagRepository
    ) {}

    async execute(): Promise<AdminDashboardMetricsOutput> {
        const [
            totalUsers,
            totalEstablishments,
            totalVisits,
            rawFlagDist,
            allFlags,
            topRated,
        ] = await Promise.all([
            this.userRepo.count(),
            this.establishmentRepo.count(),
            this.visitRepo.count(),
            this.userRepo.getFlagDistribution(),
            this.flagRepo.findAll(),
            this.establishmentRepo.findTopRated(5),
        ]);

        const flagMap = new Map(allFlags.map((f) => [f.id.toHexString(), f]));

        const flagDistribution = rawFlagDist
            .map((item) => {
                const flag = flagMap.get(item.flagId.toHexString());
                if (!flag) return null;
                return {
                    flagId: flag.id.toHexString(),
                    tag: flag.tag,
                    identifier: flag.identifier,
                    count: item.count,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        const topRatedEstablishments = topRated.map((est) => ({
            id: est.id.toHexString(),
            companyName: est.companyName,
            rating: est.rating,
            ratingCount: est.ratingCount,
            logo: est.logo || null,
        }));

        return {
            overview: {
                totalUsers,
                totalEstablishments,
                totalVisits,
            },
            flagDistribution,
            topRatedEstablishments,
        };
    }
}
