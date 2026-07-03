import { describe, it, expect } from "bun:test";
import { ObjectId } from "mongodb";
import { RecommendationService } from "@domain/services/RecommendationService";
import { Establishment } from "@domain/entities/Establishment";
import { Location } from "@domain/value-objects/Location";

describe("RecommendationService Unit Tests", () => {
    const flag1 = new ObjectId(); // e.g. Gluten-Free
    const flag2 = new ObjectId(); // e.g. Vegan
    const flag3 = new ObjectId(); // e.g. Lactose-Free

    const locCenter = Location.create({
        state: "PR",
        city: "Curitiba",
        neighborhood: "Centro",
        address: "Rua 1",
        coordinates: { lat: -25.43, lng: -49.27 }
    });

    const createEst = (name: string, flags: ObjectId[], latOffset: number, rating: number, isSponsored = false) => {
        return Establishment.create({
            companyName: name,
            location: Location.create({
                state: "PR",
                city: "Curitiba",
                neighborhood: "Bairro",
                address: name + " Address",
                coordinates: { lat: -25.43 + latOffset, lng: -49.27 + latOffset }
            }),
            flags,
            logo: "https://logo.com/1.png",
            rating,
            ratingCount: 10,
            ratingTotal: rating * 10,
            isSponsored
        });
    };

    it("should score by proximity and rating, applying sponsored bonus when user has no flags", () => {
        // Est A: 5.0 rating, 0km distance, sponsored
        // Est B: 5.0 rating, 0km distance, non-sponsored
        // Est C: 3.0 rating, 10km distance, non-sponsored
        const estA = createEst("Est A", [flag1], 0, 5, true);
        const estB = createEst("Est B", [flag1], 0, 5, false);
        const estC = createEst("Est C", [flag1], 0.09, 3, false); // ~10km away

        const results = RecommendationService.rank([estA, estB, estC], {
            userFlagIds: [],
            userLat: -25.43,
            userLng: -49.27
        });

        expect(results.length).toBe(3);
        // Est A should be first because it is sponsored and has perfect rating/distance
        expect(results[0]!.establishment.companyName).toBe("Est A");
        expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
        // Est B should be second
        expect(results[1]!.establishment.companyName).toBe("Est B");
        // Est C should be last
        expect(results[2]!.establishment.companyName).toBe("Est C");
    });

    it("should set score to 0 and ignore sponsored bonus if establishment matches 0 flags when user has flags", () => {
        // User needs flag1 and flag2
        // Est A: sponsored, but has flag3 (0 matches)
        // Est B: non-sponsored, has flag1 (1 match)
        const estA = createEst("Est A", [flag3], 0, 5, true);
        const estB = createEst("Est B", [flag1], 0, 4, false);

        const results = RecommendationService.rank([estA, estB], {
            userFlagIds: [flag1, flag2],
            userLat: -25.43,
            userLng: -49.27
        });

        expect(results.length).toBe(2);
        // Est B should be first (matches 1 flag)
        expect(results[0]!.establishment.companyName).toBe("Est B");
        expect(results[0]!.score).toBeGreaterThan(0);
        // Est A should be second, score should be exactly 0 (no sponsor bonus applied)
        expect(results[1]!.establishment.companyName).toBe("Est A");
        expect(results[1]!.score).toBe(0);
    });

    it("should guarantee that higher flag match ratio dominates lower flag match ratio", () => {
        // User needs flag1 and flag2
        // Est A: matches 1/2 flags (flag1), perfect location & rating, sponsored
        // Est B: matches 2/2 flags (flag1 & flag2), far away (10km), poor rating (1.0), non-sponsored
        const estA = createEst("Est A", [flag1], 0, 5, true);
        const estB = createEst("Est B", [flag1, flag2], 0.09, 1, false);

        const results = RecommendationService.rank([estA, estB], {
            userFlagIds: [flag1, flag2],
            userLat: -25.43,
            userLng: -49.27
        });

        expect(results.length).toBe(2);
        // Est B (2/2 flags) MUST be first despite poor rating, distance, and non-sponsored status
        expect(results[0]!.establishment.companyName).toBe("Est B");
        expect(results[1]!.establishment.companyName).toBe("Est A");
    });
});
