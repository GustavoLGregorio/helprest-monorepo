/**
 * Recursively strips MongoDB query operators (keys starting with $)
 * and nested dot notation keys from an object to prevent NoSQL injection attacks.
 */
export function sanitize<T>(input: T): T {
    if (input === null || input === undefined) return input;

    if (typeof input === "string") return input;
    if (typeof input === "number") return input;
    if (typeof input === "boolean") return input;
    if (input instanceof Date) return input;

    if (Array.isArray(input)) {
        return input.map((item) => sanitize(item)) as T;
    }

    if (typeof input === "object") {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
            if (key.startsWith("$") || key.includes(".")) continue; // Strip query operators and dot notation injection
            sanitized[key] = sanitize(value);
        }
        return sanitized as T;
    }

    return input;
}

/**
 * Validates if a string is a valid 24-character hexadecimal MongoDB ObjectId.
 */
export function isValidObjectId(id: unknown): id is string {
    if (!id || typeof id !== "string") return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
}
