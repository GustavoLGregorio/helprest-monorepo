import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createFlagModule } from "../../../../src/interface/modules/flag.module";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import { Flag } from "../../../../src/domain/entities/Flag";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("flagModule Suite (ElysiaJS)", () => {
    const flagId = new ObjectId();
    const adminId = new ObjectId();

    const mockFlag = Flag.create({
        id: flagId,
        type: "dietary",
        identifier: "vegan",
        description: "Alimentos 100% veganos",
        tag: "Vegano",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
    });

    const mockFlagRepo: IFlagRepository = {
        findById: mock(async () => mockFlag),
        findAll: mock(async () => [mockFlag]),
        findByIds: mock(async () => [mockFlag]),
        findByType: mock(async () => [mockFlag]),
        create: mock(async () => {}),
        delete: mock(async () => {}),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-user-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: new ObjectId().toHexString(), email: "user@tester.com", role: "user" });
        })
        .get("/sign-admin-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: adminId.toHexString(), email: "admin@tester.com", role: "admin" });
        })
        .use(errorPlugin)
        .use(createFlagModule(mockFlagRepo));

    it("should return flags list publicly for GET /api/flags without token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/flags"));
        expect(res.status).toBe(200);
        const body = (await res.json()) as Array<{ id: string; identifier: string }>;
        expect(body.length).toBe(1);
        expect(body[0]!.identifier).toBe("vegan");
    });

    it("should return 401 Unauthorized for POST /api/flags without Bearer token", async () => {
        const res = await testApp.handle(
            new Request("http://localhost/api/flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "dietary",
                    identifier: "lactose-free",
                    description: "Sem lactose",
                    tag: "Sem Lactose",
                    backgroundColor: "#0000FF",
                    textColor: "#FFFFFF",
                }),
            })
        );
        expect(res.status).toBe(401);
    });

    it("should return 403 Forbidden for POST /api/flags when user role is 'user'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/flags", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "dietary",
                    identifier: "lactose-free",
                    description: "Sem lactose",
                    tag: "Sem Lactose",
                    backgroundColor: "#0000FF",
                    textColor: "#FFFFFF",
                }),
            })
        );
        expect(res.status).toBe(403);
    });

    it("should create flag with 201 for POST /api/flags when user role is 'admin'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/flags", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "dietary",
                    identifier: "lactose-free",
                    description: "Sem lactose",
                    tag: "Sem Lactose",
                    backgroundColor: "#0000FF",
                    textColor: "#FFFFFF",
                }),
            })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe("string");
    });
});
