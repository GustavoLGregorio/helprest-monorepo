import { describe, expect, it } from "bun:test";
import { Location } from "../../../../src/domain/value-objects/Location";

describe("Location Value Object", () => {
    it("should create a valid location with coordinates", () => {
        const location = Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Batel",
            address: "Rua Bispo Dom José, 123",
            coordinates: { lat: -25.438, lng: -49.278 },
        });

        expect(location.state).toBe("PR");
        expect(location.city).toBe("Curitiba");
        expect(location.address).toBe("Rua Bispo Dom José, 123");
        expect(location.coordinates.lat).toBe(-25.438);
        expect(location.coordinates.lng).toBe(-49.278);
    });

    it("should throw an error for invalid latitude", () => {
        expect(() =>
            Location.create({
                state: "PR",
                city: "Curitiba",
                neighborhood: "Batel",
                address: "Invalid Lat",
                coordinates: { lat: 95, lng: -49.278 },
            }),
        ).toThrow("Invalid coordinates");
    });

    it("should throw an error for invalid longitude", () => {
        expect(() =>
            Location.create({
                state: "PR",
                city: "Curitiba",
                neighborhood: "Batel",
                address: "Invalid Lng",
                coordinates: { lat: -25.438, lng: -190 },
            }),
        ).toThrow("Invalid coordinates");
    });

    it("should throw an error when address is empty", () => {
        expect(() =>
            Location.create({
                state: "PR",
                city: "Curitiba",
                neighborhood: "Batel",
                address: "",
            }),
        ).toThrow("Location requires at least an address");
    });

    it("should format to GeoJSON point when valid coordinates exist", () => {
        const location = Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Batel",
            address: "Rua Bispo Dom José, 123",
            coordinates: { lat: -25.438, lng: -49.278 },
        });

        const geoJson = location.toGeoJSON();
        expect(geoJson).toEqual({
            type: "Point",
            coordinates: [-49.278, -25.438],
        });
    });

    it("should return null for GeoJSON when coordinates are lat=0, lng=0", () => {
        const location = Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Batel",
            address: "No Geo Location",
        });

        expect(location.toGeoJSON()).toBeNull();
    });

    it("should compare equality of locations based on coordinates", () => {
        const loc1 = Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Batel",
            address: "Address 1",
            coordinates: { lat: -25.438, lng: -49.278 },
        });

        const loc2 = Location.create({
            state: "SP",
            city: "São Paulo",
            neighborhood: "Centro",
            address: "Address 2",
            coordinates: { lat: -25.438, lng: -49.278 },
        });

        const loc3 = Location.create({
            state: "PR",
            city: "Curitiba",
            neighborhood: "Batel",
            address: "Address 1",
            coordinates: { lat: -25.500, lng: -49.300 },
        });

        expect(loc1.equals(loc2)).toBeTrue();
        expect(loc1.equals(loc3)).toBeFalse();
    });
});
