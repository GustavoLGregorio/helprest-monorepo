import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { sanitize } from "@shared/utils/sanitize";

const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : "*";

export const securityPlugin = new Elysia({ name: "security-plugin" })
    .use(
        cors({
            origin: corsOrigins,
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
            exposeHeaders: ["X-Request-Id"],
            credentials: true,
        })
    )
    .onBeforeHandle({ as: "global" }, ({ body, query }) => {
        // Sanitize body and query in-place against NoSQL injection
        if (body && typeof body === "object") {
            const sanitized = sanitize(body as Record<string, unknown>);
            for (const key of Object.keys(body as Record<string, unknown>)) {
                delete (body as Record<string, unknown>)[key];
            }
            Object.assign(body, sanitized);
        }
        if (query && typeof query === "object") {
            const sanitized = sanitize(query as Record<string, unknown>);
            for (const key of Object.keys(query as Record<string, unknown>)) {
                delete (query as Record<string, unknown>)[key];
            }
            Object.assign(query, sanitized);
        }
    })
    .onAfterHandle({ as: "global" }, ({ set }) => {
        // Apply OWASP Security Headers
        set.headers["X-Content-Type-Options"] = "nosniff";
        set.headers["X-Frame-Options"] = "DENY";
        set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        set.headers["X-XSS-Protection"] = "1; mode=block";

        if (process.env.NODE_ENV === "production") {
            set.headers["Strict-Transport-Security"] =
                "max-age=31536000; includeSubDomains; preload";
        }
    });
