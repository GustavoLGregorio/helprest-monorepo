import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { securityPlugin } from "../../../../src/interface/plugins/security.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { NotFoundError, ValidationError } from "../../../../src/shared/errors";

describe("Elysia Plugins Global Suite", () => {
    describe("errorPlugin", () => {
        const app = new Elysia()
            .use(errorPlugin)
            .get("/not-found", () => {
                throw new NotFoundError("Establishment", "123");
            })
            .get("/validation", () => {
                throw new ValidationError("Invalid payload", { email: ["Invalid format"] });
            })
            .get("/unhandled", () => {
                throw new Error("Unexpected database crash");
            });

        it("should format AppError subclasses into clean JSON with status 404", async () => {
            const res = await app.handle(new Request("http://localhost/not-found"));
            expect(res.status).toBe(404);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body.error).toBe("NotFoundError");
            expect(body.message).toBe("Establishment with id '123' not found");
        });

        it("should format ValidationError with field details and status 400", async () => {
            const res = await app.handle(new Request("http://localhost/validation"));
            expect(res.status).toBe(400);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body.error).toBe("ValidationError");
            expect(body.details).toEqual({ email: ["Invalid format"] });
        });

        it("should handle unhandled internal server errors with status 500", async () => {
            const res = await app.handle(new Request("http://localhost/unhandled"));
            expect(res.status).toBe(500);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body.error).toBe("InternalServerError");
            expect(body.message).toBe("An unexpected server error occurred");
        });
    });

    describe("securityPlugin", () => {
        const app = new Elysia()
            .use(securityPlugin)
            .post("/echo", ({ body }) => body);

        it("should add OWASP security headers to responses", async () => {
            const res = await app.handle(
                new Request("http://localhost/echo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "value" }),
                })
            );
            expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
            expect(res.headers.get("X-Frame-Options")).toBe("DENY");
        });

        it("should sanitize NoSQL injection operators from request payload", async () => {
            const res = await app.handle(
                new Request("http://localhost/echo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: { $gt: "" }, name: "John" }),
                })
            );
            const body = (await res.json()) as Record<string, unknown>;
            expect(body).toEqual({ email: {}, name: "John" });
        });
    });

    describe("authPlugin role macro", () => {
        it("should throw 401 Unauthorized when Bearer token is missing", async () => {
            const app = new Elysia()
                .use(errorPlugin)
                .use(authPlugin)
                .get("/admin-only", () => ({ status: "ok" }), {
                    role: "admin",
                });

            const res = await app.handle(new Request("http://localhost/admin-only"));
            expect(res.status).toBe(401);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body.error).toBe("UnauthorizedError");
        });

        it("should throw 401 Unauthorized when Bearer token is invalid", async () => {
            const app = new Elysia()
                .use(errorPlugin)
                .use(authPlugin)
                .get("/admin-only", () => ({ status: "ok" }), {
                    role: "admin",
                });

            const res = await app.handle(
                new Request("http://localhost/admin-only", {
                    headers: { Authorization: "Bearer invalid-jwt-token" },
                })
            );
            expect(res.status).toBe(401);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body.error).toBe("UnauthorizedError");
        });

        it("should throw 403 Forbidden when user role is insufficient", async () => {
            const testApp = new Elysia()
                .use(authPlugin)
                .get("/sign", async ({ jwtService }) => {
                    return jwtService.sign({ sub: "user-123", email: "user@test.com", role: "user" });
                })
                .use(errorPlugin)
                .get("/admin-route", () => ({ status: "ok" }), {
                    role: "admin",
                });

            const tokenRes = await testApp.handle(new Request("http://localhost/sign"));
            const token = await tokenRes.text();

            const res = await testApp.handle(
                new Request("http://localhost/admin-route", {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );
            expect(res.status).toBe(403);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body.error).toBe("ForbiddenError");
        });

        it("should allow request when user role meets or exceeds required level", async () => {
            const testApp = new Elysia()
                .use(authPlugin)
                .get("/sign", async ({ jwtService }) => {
                    return jwtService.sign({ sub: "admin-123", email: "admin@test.com", role: "admin" });
                })
                .use(errorPlugin)
                .get("/admin-route", () => ({ status: "ok" }), {
                    role: "admin",
                });

            const tokenRes = await testApp.handle(new Request("http://localhost/sign"));
            const token = await tokenRes.text();

            const res = await testApp.handle(
                new Request("http://localhost/admin-route", {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );
            expect(res.status).toBe(200);
            const body = (await res.json()) as Record<string, unknown>;
            expect(body).toEqual({ status: "ok" });
        });
    });
});
