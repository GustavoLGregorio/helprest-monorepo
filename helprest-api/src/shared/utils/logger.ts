/**
 * Generates a unique request ID for logging correlation.
 */
export function generateRequestId(): string {
    return crypto.randomUUID();
}

/**
 * Creates a structured log entry.
 */
export function createLogEntry(
    level: "info" | "warn" | "error" | "debug",
    message: string,
    meta?: Record<string, unknown>,
): string {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    });
}

export const logger = {
    info(message: string, meta?: Record<string, unknown>) {
        console.log(createLogEntry("info", message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
        console.warn(createLogEntry("warn", message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
        console.error(createLogEntry("error", message, meta));
    },
    debug(message: string, meta?: Record<string, unknown>) {
        if (process.env.NODE_ENV === "development") {
            console.debug(createLogEntry("debug", message, meta));
        }
    },
};
