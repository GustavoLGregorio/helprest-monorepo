import { describe, expect, it } from "bun:test";
import { ObjectId } from "mongodb";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Location } from "../../../../src/domain/value-objects/Location";
import { RecommendationService } from "../../../../src/domain/services/RecommendationService";

describe("RecommendationService Domain Service", () => {
    // Reference location: Curitiba Batel (-25.438, -49.278)
    const baseLat = -25.438;
    const baseLng = -49.278;

    const flagVegan = new ObjectId();
    const flagGlutenFree = new ObjectId();
    const flagLactoseFree = new ObjectId();

    const createEst = (
        name: string,
        flags: ObjectId[],
        lat: number,
        lng: number,
        rating = 4.5,
        isSponsored = false,
    ) => {
        return Establishment.create({
            companyName: name,
            location: Location.create({
                state: "PR",
                city: "Curitiba",
                neighborhood: "Batel",
                address: "Street 1",
                coordinates: { lat, lng },
            }),
            flags,
            logo: "https://example.com/logo.png",
            rating,
            ratingCount: 10,
            ratingTotal: rating * 10,
            isSponsored,
        });
    };

    describe("haversineDistance", () => {
        it("should return 0 meters for identical coordinates", () => {
            const distance = RecommendationService.haversineDistance(
                baseLat,
                baseLng,
                baseLat,
                baseLng,
            );
            expect(distance).toBe(0);
        });

        it("should calculate distance accurately between two points", () => {
            // Distance between Curitiba (-25.438, -49.278) and São Paulo (-23.550, -46.633) is ~338km
            const distance = RecommendationService.haversineDistance(
                -25.438,
                -49.278,
                -23.550,
                -46.633,
            );
            expect(Math.round(distance / 1000)).toBeCloseTo(338, -1);
        });
    });

    describe("rank", () => {
        it("should rank establishments by proximity and rating when user has no flags selected", () => {
            const estCloseLowRating = createEst("Close Low", [], baseLat + 0.001, baseLng + 0.001, 3.0);
            const estFarHighRating = createEst("Far High", [], baseLat + 0.1, baseLng + 0.1, 5.0);

            const results = RecommendationService.rank([estCloseLowRating, estFarHighRating], {
                userFlagIds: [],
                userLat: baseLat,
                userLng: baseLng,
            });

            expect(results).toHaveLength(2);
            expect(results[0]!.establishment.companyName).toBe("Close Low");
            expect(results[0]!.flagMatchCount).toBe(0);
        });

        it("should score 0 for establishments matching 0 user dietary restriction flags", () => {
            const estVegan = createEst("Vegan Place", [flagVegan], baseLat, baseLng);
            const estSteakhouse = createEst("Steakhouse", [flagGlutenFree], baseLat, baseLng);

            const results = RecommendationService.rank([estVegan, estSteakhouse], {
                userFlagIds: [flagVegan],
                userLat: baseLat,
                userLng: baseLng,
            });

            expect(results[0]!.establishment.companyName).toBe("Vegan Place");
            expect(results[0]!.score).toBeGreaterThan(0);
            expect(results[1]!.establishment.companyName).toBe("Steakhouse");
            expect(results[1]!.score).toBe(0);
        });

        it("should rank full flag match higher than partial flag match", () => {
            const estFullMatch = createEst(
                "Full Match",
                [flagVegan, flagGlutenFree],
                baseLat,
                baseLng,
                4.0,
            );
            const estPartialMatch = createEst(
                "Partial Match",
                [flagVegan],
                baseLat,
                baseLng,
                5.0,
            );

            const results = RecommendationService.rank([estPartialMatch, estFullMatch], {
                userFlagIds: [flagVegan, flagGlutenFree],
                userLat: baseLat,
                userLng: baseLng,
            });

            expect(results[0]!.establishment.companyName).toBe("Full Match");
            expect(results[0]!.flagMatchCount).toBe(2);
            expect(results[1]!.establishment.companyName).toBe("Partial Match");
            expect(results[1]!.flagMatchCount).toBe(1);
        });

        it("should give a bonus score to sponsored establishments", () => {
            const estRegular = createEst("Regular", [flagVegan], baseLat, baseLng, 4.5, false);
            const estSponsored = createEst("Sponsored", [flagVegan], baseLat, baseLng, 4.5, true);

            const results = RecommendationService.rank([estRegular, estSponsored], {
                userFlagIds: [flagVegan],
                userLat: baseLat,
                userLng: baseLng,
            });

            expect(results[0]!.establishment.companyName).toBe("Sponsored");
            expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
        });
    });
});
