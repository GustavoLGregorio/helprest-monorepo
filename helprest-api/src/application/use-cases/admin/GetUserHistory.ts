import { ObjectId } from "mongodb";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IUserFavoriteRepository } from "@domain/repositories/IUserFavoriteRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import { NotFoundError, ValidationError } from "@shared/errors";

export class GetUserHistory {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly visitRepo: IVisitRepository,
        private readonly favoriteRepo: IUserFavoriteRepository,
        private readonly establishmentRepo: IEstablishmentRepository
    ) {}

    async execute(userId: string) {
        if (!ObjectId.isValid(userId)) {
            throw new ValidationError("Invalid user ID format");
        }

        const objectId = new ObjectId(userId);
        const user = await this.userRepo.findById(objectId);

        if (!user) {
            throw new NotFoundError("User not found");
        }

        const [visits, favorites] = await Promise.all([
            this.visitRepo.findByUserId(objectId, 50, 0),
            this.favoriteRepo.findByUser(objectId),
        ]);

        const establishmentIds = [
            ...new Set([
                ...visits.map((v) => v.establishmentId),
                ...favorites
                    .filter((f) => f.type === "establishment")
                    .map((f) => f.referenceId),
            ]),
        ];

        const establishments = establishmentIds.length > 0
            ? await this.establishmentRepo.findManyByIds(establishmentIds)
            : [];
        const estMap = new Map(establishments.map((e) => [e.id.toHexString(), e]));

        return {
            user: {
                id: user.id.toHexString(),
                name: user.name,
                email: user.email,
                role: user.role.value,
                status: user.status,
                isBanned: user.isBanned,
                banReason: user.banReason,
                bannedAt: user.bannedAt ? user.bannedAt.toISOString() : null,
                profilePhoto: user.profilePhoto || null,
                createdAt: user.createdAt.toISOString(),
            },
            visits: visits.map((v) => ({
                id: v.id.toHexString(),
                establishmentId: v.establishmentId.toHexString(),
                establishmentName: estMap.get(v.establishmentId.toHexString())?.companyName || "Desconhecido",
                rating: v.rating,
                review: v.review,
                photoUrls: [...v.photoUrls],
                date: v.date.toISOString(),
                isModerated: v.isModerated,
            })),
            favorites: favorites.map((f) => ({
                id: f.id.toHexString(),
                referenceId: f.referenceId.toHexString(),
                type: f.type,
                name: estMap.get(f.referenceId.toHexString())?.companyName || "Item",
            })),
        };
    }
}
