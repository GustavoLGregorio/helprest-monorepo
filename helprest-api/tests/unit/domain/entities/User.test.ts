import { describe, expect, it } from "bun:test";
import { ObjectId } from "mongodb";
import { User } from "../../../../src/domain/entities/User";

describe("User Entity", () => {
    it("should create a valid local user", () => {
        const flagId = new ObjectId();
        const user = User.create({
            name: "John Doe",
            email: "john@example.com",
            passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$hash",
            authProvider: "local",
            flags: [flagId],
            socialLinksEnabled: false,
        });

        expect(user.id).toBeInstanceOf(ObjectId);
        expect(user.name).toBe("John Doe");
        expect(user.email).toBe("john@example.com");
        expect(user.authProvider).toBe("local");
        expect(user.role).toBe("user");
        expect(user.flags).toHaveLength(1);
        expect(user.flags[0]).toEqual(flagId);
    });

    it("should create a valid google user", () => {
        const user = User.create({
            name: "Google User",
            email: "googleuser@gmail.com",
            authProvider: "google",
            googleId: "google-oauth-id-123",
            flags: [],
            socialLinksEnabled: true,
        });

        expect(user.authProvider).toBe("google");
        expect(user.googleId).toBe("google-oauth-id-123");
        expect(user.socialLinksEnabled).toBeTrue();
    });

    it("should throw an error if name or email is missing", () => {
        expect(() =>
            User.create({
                name: "",
                email: "john@example.com",
                authProvider: "local",
                passwordHash: "secret",
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
                authProvider: "local",
                passwordHash: "secret",
                flags: [],
                socialLinksEnabled: false,
            }),
        ).toThrow("Invalid email format");
    });

    it("should throw an error if local user has no passwordHash", () => {
        expect(() =>
            User.create({
                name: "John",
                email: "john@example.com",
                authProvider: "local",
                flags: [],
                socialLinksEnabled: false,
            }),
        ).toThrow("Local auth users require a passwordHash");
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
            passwordHash: "hashedpwd",
            authProvider: "local",
            flags: [flagId],
            socialLinksEnabled: false,
            role: "user",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const user = User.fromDocument(doc);
        expect(user.id).toEqual(id);
        expect(user.name).toBe("Jane Doe");

        const serialized = user.toDocument();
        expect(serialized._id).toEqual(id);
        expect(serialized.email).toBe("jane@example.com");
    });
});
