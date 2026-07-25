import { describe, expect, it } from "bun:test";
import { sanitize, isValidObjectId } from "../../../src/shared/utils/sanitize";

describe("Sanitize Utility (NoSQL Injection Defense)", () => {
    it("should strip keys starting with $ from nested objects", () => {
        const maliciousInput = {
            username: "admin",
            password: { $ne: null },
            filter: {
                $where: "this.password.length > 0",
                validKey: "validValue",
            },
        };

        const sanitized = sanitize(maliciousInput as Record<string, unknown>);
        expect(sanitized as unknown).toEqual({
            username: "admin",
            password: {},
            filter: {
                validKey: "validValue",
            },
        });
    });

    it("should strip dot-notation keys that attempt property override", () => {
        const maliciousInput = {
            "user.role": "admin",
            normalField: "hello",
        };

        const sanitized = sanitize(maliciousInput as Record<string, unknown>);
        expect(sanitized as unknown).toEqual({
            normalField: "hello",
        });
    });

    it("should process arrays recursively", () => {
        const input = [
            { name: "item1", $gt: 10 },
            { name: "item2", valid: true },
        ];

        const sanitized = sanitize(input as unknown[]);
        expect(sanitized as unknown).toEqual([
            { name: "item1" },
            { name: "item2", valid: true },
        ]);
    });

    it("should validate 24-character hexadecimal MongoDB ObjectIds correctly", () => {
        expect(isValidObjectId("507f1f77bcf86cd799439011")).toBeTrue();
        expect(isValidObjectId("60c72b2f9b1d8b2d88c8e11a")).toBeTrue();

        expect(isValidObjectId("invalid-id")).toBeFalse();
        expect(isValidObjectId("507f1f77bcf86cd79943901")).toBeFalse(); // 23 chars
        expect(isValidObjectId("507f1f77bcf86cd7994390111")).toBeFalse(); // 25 chars
        expect(isValidObjectId("507f1f77bcf86cd79943901g")).toBeFalse(); // 'g' non-hex
        expect(isValidObjectId(null)).toBeFalse();
        expect(isValidObjectId(undefined)).toBeFalse();
    });
});
