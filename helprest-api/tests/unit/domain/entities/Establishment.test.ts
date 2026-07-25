import { describe, expect, it } from "bun:test";
import { ObjectId } from "mongodb";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Location } from "../../../../src/domain/value-objects/Location";

describe("Establishment Entity", () => {
    const validLocation = Location.create({
        state: "PR",
        city: "Curitiba",
        neighborhood: "Batel",
        address: "Rua Bispo Dom José, 123",
        coordinates: { lat: -25.438, lng: -49.278 },
    });

    it("should create a valid establishment", () => {
        const flagId = new ObjectId();
        const est = Establishment.create({
            companyName: "Green Restaurant",
            location: validLocation,
            flags: [flagId],
            logo: "https://example.com/logo.png",
            rating: 4.8,
            ratingCount: 10,
            ratingTotal: 48,
            isSponsored: true,
        });

        expect(est.id).toBeInstanceOf(ObjectId);
        expect(est.companyName).toBe("Green Restaurant");
        expect(est.isSponsored).toBeTrue();
        expect(est.rating).toBe(4.8);
        expect(est.flags).toHaveLength(1);
    });

    it("should throw an error if companyName is missing", () => {
        expect(() =>
            Establishment.create({
                companyName: "",
                location: validLocation,
                flags: [],
                logo: "https://example.com/logo.png",
                rating: 0,
                ratingCount: 0,
                ratingTotal: 0,
            }),
        ).toThrow("Establishment requires a company name");
    });

    it("should correctly recalculate rating with withNewRating", () => {
        const est = Establishment.create({
            companyName: "Test Bistro",
            location: validLocation,
            flags: [],
            logo: "https://example.com/logo.png",
            rating: 4.0,
            ratingCount: 2,
            ratingTotal: 8.0,
        });

        const updatedEst = est.withNewRating(5.0);
        expect(updatedEst.ratingCount).toBe(3);
        expect(updatedEst.ratingTotal).toBe(13.0);
        expect(updatedEst.rating).toBe(4.3); // 13 / 3 = 4.333 -> 4.3
    });

    it("should convert to and from document", () => {
        const id = new ObjectId();
        const doc = {
            _id: id,
            companyName: "Bistro 123",
            location: {
                state: "PR",
                city: "Curitiba",
                neighborhood: "Batel",
                address: "Rua Teste, 1",
                coordinates: {
                    type: "Point",
                    coordinates: [-49.278, -25.438],
                },
            },
            flags: [],
            logo: "https://example.com/logo.png",
            rating: 4.5,
            ratingCount: 4,
            ratingTotal: 18,
            isSponsored: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const est = Establishment.fromDocument(doc);
        expect(est.id).toEqual(id);
        expect(est.companyName).toBe("Bistro 123");
        expect(est.location.coordinates.lat).toBe(-25.438);

        const serialized = est.toDocument();
        expect(serialized._id).toEqual(id);
        expect(serialized.companyName).toBe("Bistro 123");
    });
});
