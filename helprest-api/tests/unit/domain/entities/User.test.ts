import { describe, expect, it } from "bun:test";
import { ObjectId } from "mongodb";
import { User } from "../../../../src/domain/entities/User";

describe("User Entity (OAuth-Only)", () => {
    it("should create a valid Google OAuth user", () => {
        const flagId = new ObjectId();
        const user = User.create({
            name: "John Doe",
            email: "john@example.com",
            authProvider: "google",
            googleId: "google-oauth-id-123",
            flags: [flagId],
            socialLinksEnabled: false,
        });

        expect(user.id).toBeInstanceOf(ObjectId);
        expect(user.name).toBe("John Doe");
        expect(user.email).toBe("john@example.com");
        expect(user.authProvider).toBe("google");
        expect(user.googleId).toBe("google-oauth-id-123");
        expect(user.role).toBe("user");
        expect(user.flags).toHaveLength(1);
        expect(user.flags[0]).toEqual(flagId);
    });

    it("should throw an error if name or email is missing", () => {
        expect(() =>
            User.create({
                name: "",
                email: "john@example.com",
                authProvider: "google",
                googleId: "google-123",
                flags: [],
                socialLinksEnabled: false,
            }),
        ).toThrow("User requires name and email");
    });

    it("should throw an error for invalid email format", () => {
        expect(() =>
            User.create({
                name: "John",
                email: "invalid-email-string",
                authProvider: "google",
                googleId: "google-123",
                flags: [],
                socialLinksEnabled: false,
            }),
        ).toThrow("Invalid email format");
    });

    it("should throw an error if google user has no googleId", () => {
        expect(() =>
            User.create({
                name: "Google User",
                email: "user@gmail.com",
                authProvider: "google",
                flags: [],
                socialLinksEnabled: false,
            }),
        ).toThrow("Google auth users require a googleId");
    });

    it("should convert to and from MongoDB document", () => {
        const id = new ObjectId();
        const flagId = new ObjectId();
        const doc = {
            _id: id,
            name: "Jane Doe",
            email: "jane@example.com",
            authProvider: "google",
            googleId: "google-jane-789",
            flags: [flagId],
            socialLinksEnabled: false,
            role: "user",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const user = User.fromDocument(doc);
        expect(user.id).toEqual(id);
        expect(user.name).toBe("Jane Doe");
        expect(user.googleId).toBe("google-jane-789");

        const serialized = user.toDocument();
        expect(serialized._id).toEqual(id);
        expect(serialized.email).toBe("jane@example.com");
    });
});
