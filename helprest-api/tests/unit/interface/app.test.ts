import { describe, expect, it } from "bun:test";
import { app } from "../../../src/app";

describe("HelpRest Elysia App Suite (Global & Swagger)", () => {
    it("should respond to GET /api/health with status 200 and status ok", async () => {
        const res = await app.handle(new Request("http://localhost/api/health"));
        expect(res.status).toBe(200);
        const body = (await res.json()) as { status: string; timestamp: string };
        expect(body.status).toBe("ok");
        expect(typeof body.timestamp).toBe("string");
    });

    it("should serve OpenAPI / Swagger documentation on GET /swagger/json", async () => {
        const res = await app.handle(new Request("http://localhost/swagger/json"));
        expect(res.status).toBe(200);
        const swaggerDoc = (await res.json()) as { info: { title: string; version: string }; paths: Record<string, unknown> };
        expect(swaggerDoc.info.title).toBe("HelpRest API");
        expect(swaggerDoc.info.version).toBe("1.0.0");
        expect(swaggerDoc.paths["/api/health"]).toBeDefined();
        expect(swaggerDoc.paths["/api/auth/google"]).toBeDefined();
        expect(swaggerDoc.paths["/api/users/me"]).toBeDefined();
        expect(swaggerDoc.paths["/api/establishments"]).toBeDefined();
        expect(swaggerDoc.paths["/api/products"]).toBeDefined();
        expect(swaggerDoc.paths["/api/flags"]).toBeDefined();
        expect(swaggerDoc.paths["/api/visits"]).toBeDefined();
        expect(swaggerDoc.paths["/api/favorites"]).toBeDefined();
    });
});
