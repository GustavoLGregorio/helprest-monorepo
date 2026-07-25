import type { IVisitRepository } from "@domain/repositories/IVisitRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import { RecommendationService } from "@domain/services/RecommendationService";

export interface GetSocialFeedInput {
    lat: number;
    lng: number;
    page: number;
    limit: number;
}

export interface FeedItemDTO {
    id: string;
    type: "visit" | "new_establishment";
    date: Date;
    rating?: number;
    review?: string;
    photoUrls?: string[];
    user?: {
        id: string;
        name: string;
        profilePhoto: string | null;
    };
    establishment?: {
        id: string;
        companyName: string;
        logo: string;
        distanceMeters?: number;
        flags?: Array<{
            id: string;
            tag: string;
            backgroundColor: string;
            textColor: string;
        }>;
    };
}

export class GetSocialFeed {
    constructor(
        private readonly visitRepo: IVisitRepository,
        private readonly estRepo: IEstablishmentRepository,
        private readonly userRepo: IUserRepository,
        private readonly flagRepo: IFlagRepository,
    ) { }

    async execute(input: GetSocialFeedInput): Promise<FeedItemDTO[]> {
        const limit = input.limit || 15;
        const page = input.page || 1;
        const skip = (page - 1) * limit;

        // 1. Fetch recent visits with photos (twice the limit to have enough margin for merging)
        const visits = await this.visitRepo.findRecentWithPhotos(limit * 2, skip);
        
        // Populate visits with user and establishment details
        const visitItems: FeedItemDTO[] = await Promise.all(
            visits.map(async (v) => {
                const [user, est] = await Promise.all([
                    this.userRepo.findById(v.userId),
                    this.estRepo.findById(v.establishmentId)
                ]);

                // Calculate distance if coordinates are present
                let distanceMeters: number | undefined;
                if (est && input.lat && input.lng) {
                    distanceMeters = Math.round(
                        RecommendationService.haversineDistance(
                            input.lat,
                            input.lng,
                            est.location.coordinates.lat,
                            est.location.coordinates.lng
                        )
                    );
                }

                return {
                    id: v.id.toHexString(),
                    type: "visit" as const,
                    date: v.date,
                    rating: v.rating,
                    review: v.review,
                    photoUrls: [...v.photoUrls],
                    user: {
                        id: v.userId.toHexString(),
                        name: user?.name ?? "Usuário HelpRest",
                        profilePhoto: user?.profilePhoto ?? null
                    },
                    establishment: est ? {
                        id: est.id.toHexString(),
                        companyName: est.companyName,
                        logo: est.logo,
                        distanceMeters
                    } : {
                        id: v.establishmentId.toHexString(),
                        companyName: "Estabelecimento Desconhecido",
                        logo: ""
                    }
                };
            })
        );

        // 2. Fetch nearby establishments (up to 50km)
        const nearbyEsts = await this.estRepo.findNearby({
            lat: input.lat,
            lng: input.lng,
            maxDistanceMeters: 50_000,
            limit: 50
        });

        // Filter establishments created in the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newEstablishments = nearbyEsts.filter(est => est.createdAt >= thirtyDaysAgo);

        // Populate new establishments with flags and structure as FeedItemDTO
        const newEstItems: FeedItemDTO[] = await Promise.all(
            newEstablishments.map(async (est) => {
                const flags = est.flags.length > 0 ? await this.flagRepo.findByIds([...est.flags]) : [];
                
                const distanceMeters = Math.round(
                    RecommendationService.haversineDistance(
                        input.lat,
                        input.lng,
                        est.location.coordinates.lat,
                        est.location.coordinates.lng
                    )
                );

                return {
                    id: est.id.toHexString(),
                    type: "new_establishment" as const,
                    date: est.createdAt,
                    rating: est.rating,
                    establishment: {
                        id: est.id.toHexString(),
                        companyName: est.companyName,
                        logo: est.logo,
                        distanceMeters,
                        flags: flags.map(f => ({
                            id: f.id.toHexString(),
                            tag: f.tag,
                            backgroundColor: f.backgroundColor,
                            textColor: f.textColor
                        }))
                    }
                };
            })
        );

        // 3. Merge and sort by date descending
        const combinedFeed = [...visitItems, ...newEstItems].sort(
            (a, b) => b.date.getTime() - a.date.getTime()
        );

        // 4. Apply pagination slice on the sorted list
        return combinedFeed.slice(0, limit);
    }
}
