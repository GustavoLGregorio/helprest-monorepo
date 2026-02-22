/**
 * Recursively strips MongoDB query operators (keys starting with $)
 * from an object to prevent NoSQL injection attacks.
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
            if (key.startsWith("$")) continue; // Strip query operators
            sanitized[key] = sanitize(value);
        }
        return sanitized as T;
    }

    return input;
}
