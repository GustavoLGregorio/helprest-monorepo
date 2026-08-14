import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createFlagModule } from "../../../../src/interface/modules/flag.module";
import type { IFlagRepository } from "../../../../src/domain/repositories/IFlagRepository";
import { Flag } from "../../../../src/domain/entities/Flag";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("flagModule Suite (ElysiaJS)", () => {
    const adminId = new ObjectId();
    const userId = new ObjectId();
    const flagId = new ObjectId();

    const mockFlag = Flag.create({
        id: flagId,
        type: "dietary",
        identifier: "vegan",
        description: "Vegano",
        tag: "Vegano",
        backgroundColor: "#00FF00",
        textColor: "#FFFFFF",
    });

    const mockFlagRepo: IFlagRepository = {
        findById: mock(async (id: ObjectId) => {
            if (id.equals(flagId)) return mockFlag;
            return null;
        }),
        findAll: mock(async (includeInactive?: boolean) => [mockFlag]),
        findByIds: mock(async () => [mockFlag]),
        findByType: mock(async () => [mockFlag]),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        updateOrder: mock(async () => {}),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-user-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: userId.toHexString(), email: "user@tester.com", role: "user" });
        })
        .get("/sign-admin-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: adminId.toHexString(), email: "admin@tester.com", role: "admin" });
        })
        .use(errorPlugin)
        .use(createFlagModule(mockFlagRepo));

    it("should return flags list publicly for GET /api/flags without token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/flags"));
        expect(res.status).toBe(200);
        const body = (await res.json()) as Array<{ id: string; tag: string }>;
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(1);
        expect(body[0]!.tag).toBe("Vegano");
    });

    it("should return 401 Unauthorized for GET /api/flags/admin/all without Bearer token", async () => {
        const res = await testApp.handle(new Request("http://localhost/api/flags/admin/all"));
        expect(res.status).toBe(401);
    });

    it("should return all flags for GET /api/flags/admin/all with admin token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/flags/admin/all", {
                headers: { Authorization: `Bearer ${token}` },
            })
        );
        expect(res.status).toBe(200);
    });

    it("should return 401 Unauthorized for POST /api/flags without Bearer token", async () => {
        const res = await testApp.handle(
            new Request("http://localhost/api/flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "dietary",
                    identifier: "gluten-free",
                    description: "Sem Glúten",
                    tag: "Sem Glúten",
                    backgroundColor: "#FF8800",
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
                    identifier: "gluten-free",
                    description: "Sem Glúten",
                    tag: "Sem Glúten",
                    backgroundColor: "#FF8800",
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
                    identifier: "gluten-free",
                    description: "Sem Glúten",
                    tag: "Sem Glúten",
                    backgroundColor: "#FF8800",
                    textColor: "#FFFFFF",
                }),
            })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe("string");
    });

    it("should update flag with 200 for PATCH /api/flags/:id with admin token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/flags/${flagId.toHexString()}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description: "100% Vegano",
                    isActive: true,
                }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { description: string };
        expect(body.description).toBe("100% Vegano");
    });

    it("should batch reorder flags with 200 for PATCH /api/flags/reorder with admin token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/flags/reorder", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orders: [
                        { id: flagId.toHexString(), order: 1 },
                    ],
                }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { success: boolean };
        expect(body.success).toBe(true);
    });

    it("should delete flag with 200 for DELETE /api/flags/:id with admin token", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/flags/${flagId.toHexString()}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { success: boolean };
        expect(body.success).toBe(true);
    });
});
