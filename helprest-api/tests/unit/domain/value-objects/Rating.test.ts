import { describe, expect, it } from "bun:test";
import { Rating } from "../../../../src/domain/value-objects/Rating";

describe("Rating Value Object", () => {
    it("should create a valid rating", () => {
        const rating = Rating.create(4.5);
        expect(rating.value).toBe(4.5);
    });

    it("should round ratings to one decimal place", () => {
        const rating = Rating.create(4.6666);
        expect(rating.value).toBe(4.7);
    });

    it("should throw an error for ratings below 0", () => {
        expect(() => Rating.create(-1)).toThrow("Rating must be between 0 and 5");
    });

    it("should throw an error for ratings above 5", () => {
        expect(() => Rating.create(5.5)).toThrow("Rating must be between 0 and 5");
    });

    it("should calculate rating from average correctly", () => {
        const rating = Rating.fromAverage(14, 3);
        expect(rating.value).toBe(4.7);
    });

    it("should return 0 rating when count is 0", () => {
        const rating = Rating.fromAverage(0, 0);
        expect(rating.value).toBe(0);
    });

    it("should compare equality correctly", () => {
        const rating1 = Rating.create(4.5);
        const rating2 = Rating.create(4.5);
        const rating3 = Rating.create(3.0);

        expect(rating1.equals(rating2)).toBeTrue();
        expect(rating1.equals(rating3)).toBeFalse();
    });
});
