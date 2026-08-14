import { describe, expect, it, mock } from "bun:test";
import { errorPlugin } from "../../../../src/interface/plugins/error.plugin";
import { authPlugin } from "../../../../src/interface/plugins/auth.plugin";
import { createProductModule } from "../../../../src/interface/modules/product.module";
import type { ProductRepository } from "../../../../src/application/repositories/ProductRepository";
import type { IEstablishmentRepository } from "../../../../src/domain/repositories/IEstablishmentRepository";
import { Product } from "../../../../src/domain/entities/Product";
import { Establishment } from "../../../../src/domain/entities/Establishment";
import { Location } from "../../../../src/domain/value-objects/Location";
import { ObjectId } from "mongodb";
import { Elysia } from "elysia";

describe("productModule Suite (ElysiaJS)", () => {
    const adminId = new ObjectId();
    const otherAdminId = new ObjectId();
    const estId = new ObjectId();
    const productId = new ObjectId();
    const flagId = new ObjectId();

    const mockLocation = Location.create({
        state: "PR",
        city: "Curitiba",
        neighborhood: "Centro",
        address: "Rua XV, 100",
        coordinates: { lat: -25.4284, lng: -49.2733 },
    });

    const mockEstablishment = Establishment.create({
        id: estId,
        companyName: "Restaurante Verde",
        location: mockLocation,
        flags: [flagId],
        logo: "https://example.com/logo.png",
        rating: 0,
        ratingCount: 0,
        ratingTotal: 0,
        adminId,
    });

    const mockProduct = Product.create({
        id: productId,
        establishmentId: estId,
        name: "Hambúrguer Vegano",
        description: "Hambúrguer de grão de bico artesanal",
        price: 32.5,
        imageUrl: "https://example.com/burger.jpg",
        ingredients: ["grão de bico", "pão vegano", "alface", "tomate"],
        flags: [flagId],
        isActive: true,
    });

    const mockProductRepo: ProductRepository = {
        save: mock(async () => {}),
        findById: mock(async (id: ObjectId) => (id.equals(productId) ? mockProduct : null)),
        findManyByIds: mock(async () => [mockProduct]),
        findByEstablishmentId: mock(async () => [mockProduct]),
        delete: mock(async () => {}),
    };

    const mockEstRepo: IEstablishmentRepository = {
        findById: mock(async (id: ObjectId) => (id.equals(estId) ? mockEstablishment : null)),
        findByAdminId: mock(async (id: ObjectId) => (id.equals(adminId) ? mockEstablishment : null)),
        findAll: mock(async () => [mockEstablishment]),
        findManyByIds: mock(async () => [mockEstablishment]),
        findNearby: mock(async () => [mockEstablishment]),
        findByFlags: mock(async () => [mockEstablishment]),
        search: mock(async () => [mockEstablishment]),
        findSponsored: mock(async () => [mockEstablishment]),
        create: mock(async () => {}),
        update: mock(async () => {}),
        delete: mock(async () => {}),
        count: mock(async () => 1),
        findTopRated: mock(async () => [mockEstablishment]),
    };

    const testApp = new Elysia()
        .use(authPlugin)
        .get("/sign-user-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: new ObjectId().toHexString(), email: "user@tester.com", role: "user" });
        })
        .get("/sign-admin-token", async ({ jwtService }) => {
            return jwtService.sign({ sub: adminId.toHexString(), email: "admin@tester.com", role: "establishment_admin" });
        })
        .use(errorPlugin)
        .use(createProductModule(mockProductRepo, mockEstRepo));

    it("should return 401 Unauthorized for POST /api/products without Bearer token", async () => {
        const res = await testApp.handle(
            new Request("http://localhost/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    establishmentId: estId.toHexString(),
                    name: "Salada",
                    price: 20,
                }),
            })
        );
        expect(res.status).toBe(401);
    });

    it("should reject POST /api/products with 403 when role is 'user'", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-user-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/products", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    establishmentId: estId.toHexString(),
                    name: "Salada",
                    price: 20,
                }),
            })
        );
        expect(res.status).toBe(403);
    });

    it("should create product with 201 when role is 'establishment_admin' and owns establishment", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request("http://localhost/api/products", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    establishmentId: estId.toHexString(),
                    name: "Suco Natural",
                    description: "Suco de laranja natural",
                    price: 12,
                    imageUrl: "https://example.com/suco.jpg",
                    ingredients: ["laranja"],
                    flags: [flagId.toHexString()],
                }),
            })
        );
        expect(res.status).toBe(201);
        const body = (await res.json()) as { id: string };
        expect(typeof body.id).toBe("string");
    });

    it("should update product with 200 for PATCH /api/products/:id", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/products/${productId.toHexString()}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    price: 35.0,
                    isActive: false,
                }),
            })
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { id: string };
        expect(body.id).toBe(productId.toHexString());
    });

    it("should delete product with 200 for DELETE /api/products/:id", async () => {
        const tokenRes = await testApp.handle(new Request("http://localhost/sign-admin-token"));
        const token = await tokenRes.text();

        const res = await testApp.handle(
            new Request(`http://localhost/api/products/${productId.toHexString()}`, {
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
