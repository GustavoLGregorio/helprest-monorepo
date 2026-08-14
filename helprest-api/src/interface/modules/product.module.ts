import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { CreateProduct, UpdateProduct, DeleteProduct } from "@application/use-cases/product";
import { MongoProductRepository } from "@infra/repositories/MongoProductRepository";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import type { ProductRepository } from "@application/repositories/ProductRepository";
import type { IEstablishmentRepository } from "@domain/repositories/IEstablishmentRepository";
import type { CreateProductInput, UpdateProductInput } from "@interface/validation/product.schema";
import { UnauthorizedError } from "@shared/errors";

export const createProductModule = (
    productRepo: ProductRepository = new MongoProductRepository(),
    establishmentRepo: IEstablishmentRepository = new MongoEstablishmentRepository()
) => {
    const createProductUseCase = new CreateProduct(productRepo, establishmentRepo);
    const updateProductUseCase = new UpdateProduct(productRepo, establishmentRepo);
    const deleteProductUseCase = new DeleteProduct(productRepo, establishmentRepo);

    return new Elysia({ prefix: "/api/products", name: "product-module" })
        .use(authPlugin)
        .post(
            "/",
            async ({ user, body, set }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await createProductUseCase.execute(user.sub, body as CreateProductInput);
                set.status = 201;
                return result;
            },
            {
                role: "establishment_admin",
                body: t.Object({
                    establishmentId: t.String({ minLength: 24, maxLength: 24 }),
                    name: t.String({ minLength: 1, maxLength: 200 }),
                    description: t.Optional(t.String({ maxLength: 500 })),
                    price: t.Numeric({ minimum: 0 }),
                    imageUrl: t.Optional(t.Nullable(t.String())),
                    ingredients: t.Optional(t.Array(t.String({ maxLength: 150 }))),
                    flags: t.Optional(t.Array(t.String({ minLength: 1 }))),
                }),
                detail: {
                    summary: "Create New Product in Establishment Menu",
                    tags: ["Products"],
                },
            }
        )
        .patch(
            "/:id",
            async ({ user, params, body }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await updateProductUseCase.execute(user.sub, params.id, body as UpdateProductInput);
                return result;
            },
            {
                role: "establishment_admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                body: t.Object({
                    name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
                    description: t.Optional(t.String({ maxLength: 500 })),
                    price: t.Optional(t.Numeric({ minimum: 0 })),
                    imageUrl: t.Optional(t.Nullable(t.String())),
                    ingredients: t.Optional(t.Array(t.String({ maxLength: 150 }))),
                    flags: t.Optional(t.Array(t.String({ minLength: 1 }))),
                    isActive: t.Optional(t.Boolean()),
                }),
                detail: {
                    summary: "Update Product Details or Toggle Active Status",
                    tags: ["Products"],
                },
            }
        )
        .delete(
            "/:id",
            async ({ user, params }) => {
                if (!user) throw new UnauthorizedError("User is not authenticated");
                const result = await deleteProductUseCase.execute(user.sub, params.id);
                return result;
            },
            {
                role: "establishment_admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                detail: {
                    summary: "Delete Product from Establishment Menu",
                    tags: ["Products"],
                },
            }
        );
};

export const productModule = createProductModule();
