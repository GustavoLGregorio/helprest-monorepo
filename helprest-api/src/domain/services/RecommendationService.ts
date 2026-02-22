import { ObjectId } from "mongodb";
import type { Establishment } from "../entities/Establishment";

export interface RecommendationInput {
    userFlagIds: ObjectId[];
    userLat: number;
    userLng: number;
}

export interface ScoredEstablishment {
    establishment: Establishment;
    score: number;
    flagMatchCount: number;
    distanceMeters: number;
}

/**
 * Domain service that implements the core recommendation algorithm.
 *
 * Strategy:
 * 1. Full match (all user flags) gets highest priority
 * 2. Partial match scored by: flagMatchRatio * 0.5 + ratingNormalized * 0.3 + proximityScore * 0.2
 * 3. Sponsored establishments get a small bonus
 */
export class RecommendationService {
    private static readonly WEIGHT_FLAG_MATCH = 0.5;
    private static readonly WEIGHT_RATING = 0.3;
    private static readonly WEIGHT_PROXIMITY = 0.2;
    private static readonly SPONSOR_BONUS = 0.05;
    private static readonly MAX_DISTANCE_METERS = 50_000; // 50km

    /**
     * Scores and ranks establishments based on the user's flags, location, and establishment quality.
     */
    static rank(
        establishments: Establishment[],
        input: RecommendationInput,
    ): ScoredEstablishment[] {
        const userFlagSet = new Set(input.userFlagIds.map((id) => id.toHexString()));
        const totalUserFlags = userFlagSet.size;

        if (totalUserFlags === 0) {
            // No flags → sort by rating and proximity only
            return establishments
                .map((est) => {
                    const distance = this.haversineDistance(
                        input.userLat,
                        input.userLng,
                        est.location.coordinates.lat,
                        est.location.coordinates.lng,
                    );
                    return {
                        establishment: est,
                        score: this.normalizeRating(est.rating) * 0.6 + this.proximityScore(distance) * 0.4,
                        flagMatchCount: 0,
                        distanceMeters: distance,
                    };
                })
                .sort((a, b) => b.score - a.score);
        }

        return establishments
            .map((est) => {
                const matchCount = est.flags.filter((fid) => userFlagSet.has(fid.toHexString())).length;
                const flagMatchRatio = matchCount / totalUserFlags;

                const distance = this.haversineDistance(
                    input.userLat,
                    input.userLng,
                    est.location.coordinates.lat,
                    est.location.coordinates.lng,
                );

                let score =
                    flagMatchRatio * this.WEIGHT_FLAG_MATCH +
                    this.normalizeRating(est.rating) * this.WEIGHT_RATING +
                    this.proximityScore(distance) * this.WEIGHT_PROXIMITY;

                if (est.isSponsored) {
                    score += this.SPONSOR_BONUS;
                }

                return {
                    establishment: est,
                    score,
                    flagMatchCount: matchCount,
                    distanceMeters: Math.round(distance),
                };
            })
            .sort((a, b) => b.score - a.score);
    }

    private static normalizeRating(rating: number): number {
        return rating / 5;
    }

    private static proximityScore(distanceMeters: number): number {
        if (distanceMeters <= 0) return 1;
        if (distanceMeters >= this.MAX_DISTANCE_METERS) return 0;
        return 1 - distanceMeters / this.MAX_DISTANCE_METERS;
    }

    /**
     * Calculates the distance between two points on Earth using the Haversine formula.
     * Returns distance in meters.
     */
    static haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6_371_000; // Earth radius in meters
        const toRad = (deg: number) => (deg * Math.PI) / 180;

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
