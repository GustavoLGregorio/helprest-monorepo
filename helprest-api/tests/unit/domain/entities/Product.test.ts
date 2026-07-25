import { describe, expect, it } from "bun:test";
import { ObjectId } from "mongodb";
import { Product } from "../../../../src/domain/entities/Product";

describe("Product Entity", () => {
    it("should create a valid product", () => {
        const estId = new ObjectId();
        const flagId = new ObjectId();
        const product = Product.create({
            establishmentId: estId,
            flags: [flagId],
            name: "Gluten-Free Burger",
            description: "Delicious burger with gluten-free bun",
            price: 35.9,
            ingredients: ["Gluten-free Bun", "Beef Patty", "Lettuce", "Tomato"],
            isActive: true,
        });

        expect(product.id).toBeInstanceOf(ObjectId);
        expect(product.establishmentId).toEqual(estId);
        expect(product.name).toBe("Gluten-Free Burger");
        expect(product.price).toBe(35.9);
        expect(product.ingredients).toHaveLength(4);
        expect(product.isActive).toBeTrue();
    });

    it("should throw an error if product name is empty", () => {
        expect(() =>
            Product.create({
                establishmentId: new ObjectId(),
                flags: [],
                name: "   ",
                description: "Valid description",
                price: 10,
            }),
        ).toThrow("Product requires a name");
    });

    it("should throw an error if price is negative", () => {
        expect(() =>
            Product.create({
                establishmentId: new ObjectId(),
                flags: [],
                name: "Product",
                description: "Valid description",
                price: -5,
            }),
        ).toThrow("Product price cannot be negative");
    });

    it("should throw an error if description exceeds 500 characters", () => {
        const longDesc = "a".repeat(501);
        expect(() =>
            Product.create({
                establishmentId: new ObjectId(),
                flags: [],
                name: "Product",
                description: longDesc,
                price: 10,
            }),
        ).toThrow("Product description cannot exceed 500 characters");
    });

    it("should throw an error if a single ingredient exceeds 150 characters", () => {
        const longIngredient = "i".repeat(151);
        expect(() =>
            Product.create({
                establishmentId: new ObjectId(),
                flags: [],
                name: "Product",
                description: "Valid desc",
                price: 10,
                ingredients: [longIngredient],
            }),
        ).toThrow("Single ingredient cannot exceed 150 characters");
    });

    it("should throw an error if product has more than 30 ingredients", () => {
        const ingredients = Array.from({ length: 31 }, (_, i) => `Ingredient ${i}`);
        expect(() =>
            Product.create({
                establishmentId: new ObjectId(),
                flags: [],
                name: "Product",
                description: "Valid desc",
                price: 10,
                ingredients,
            }),
        ).toThrow("Product cannot have more than 30 ingredients");
    });

    it("should convert to and from document", () => {
        const id = new ObjectId();
        const estId = new ObjectId();
        const doc = {
            _id: id,
            establishmentId: estId,
            flags: [],
            name: "Salad",
            description: "Fresh green salad",
            price: 20,
            imageUrl: "https://example.com/salad.jpg",
            ingredients: ["Lettuce", "Cucumber"],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const product = Product.fromDocument(doc);
        expect(product.id).toEqual(id);
        expect(product.name).toBe("Salad");
        expect(product.imageUrl).toBe("https://example.com/salad.jpg");

        const serialized = product.toDocument();
        expect(serialized._id).toEqual(id);
        expect(serialized.price).toBe(20);
    });
});
