import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";

export class ListReportedVisits {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly userRepo: IUserRepository,
        private readonly establishmentRepo: IEstablishmentRepository
    ) {}

    async execute(limit = 20, skip = 0) {
        const visits = await this.visitRepo.findReported(limit, skip);

        const enriched = await Promise.all(
            visits.map(async (v) => {
                const [user, establishment] = await Promise.all([
                    this.userRepo.findById(v.userId),
                    this.establishmentRepo.findById(v.establishmentId),
                ]);

                return {
                    id: v.id.toHexString(),
                    establishmentId: v.establishmentId.toHexString(),
                    establishmentName: establishment?.companyName || "Desconhecido",
                    userId: v.userId.toHexString(),
                    userName: user?.name || "Anônimo",
                    userPhoto: user?.profilePhoto || null,
                    rating: v.rating,
                    review: v.review,
                    photoUrls: [...v.photoUrls],
                    date: v.date.toISOString(),
                    isModerated: v.isModerated,
                    moderationReason: v.moderationReason,
                    isReported: v.isReported,
                    reportCount: v.reportCount,
                    reports: v.reports.map((r) => ({
                        userId: r.userId.toHexString(),
                        reason: r.reason,
                        createdAt: r.createdAt.toISOString(),
                    })),
                };
            })
        );

        return enriched;
    }
}
