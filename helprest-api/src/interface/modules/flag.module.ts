import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import {
    ListFlags,
    CreateFlag,
    UpdateFlag,
    DeleteFlag,
    ReorderFlags,
    type CreateFlagInput,
    type UpdateFlagInput,
} from "@application/use-cases/flag";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";

export const createFlagModule = (
    flagRepo: IFlagRepository = new MongoFlagRepository()
) => {
    const listFlagsUseCase = new ListFlags(flagRepo);
    const createFlagUseCase = new CreateFlag(flagRepo);
    const updateFlagUseCase = new UpdateFlag(flagRepo);
    const deleteFlagUseCase = new DeleteFlag(flagRepo);
    const reorderFlagsUseCase = new ReorderFlags(flagRepo);

    return new Elysia({ prefix: "/api/flags", name: "flag-module" })
        .use(authPlugin)
        .get(
            "",
            async () => {
                return await listFlagsUseCase.execute(false);
            },
            {
                detail: {
                    summary: "List All Active Dietary and Accessibility Flags",
                    tags: ["Flags"],
                },
            }
        )
        .get(
            "/admin/all",
            async () => {
                return await listFlagsUseCase.execute(true);
            },
            {
                role: "admin",
                detail: {
                    summary: "List All Flags (Including Inactive) for Admin Management",
                    tags: ["Flags"],
                },
            }
        )
        .post(
            "",
            async ({ body, set }) => {
                const result = await createFlagUseCase.execute(body as CreateFlagInput);
                set.status = 201;
                return result;
            },
            {
                role: "admin",
                body: t.Object({
                    type: t.String({ minLength: 1, maxLength: 50 }),
                    identifier: t.String({ minLength: 1, maxLength: 50 }),
                    description: t.String({ minLength: 1, maxLength: 500 }),
                    tag: t.String({ minLength: 1, maxLength: 50 }),
                    backgroundColor: t.String({ minLength: 4, maxLength: 20 }),
                    textColor: t.String({ minLength: 4, maxLength: 20 }),
                    isActive: t.Optional(t.Boolean()),
                    order: t.Optional(t.Number()),
                }),
                detail: {
                    summary: "Create a New Flag",
                    tags: ["Flags"],
                },
            }
        )
        .patch(
            "/reorder",
            async ({ body }) => {
                return await reorderFlagsUseCase.execute(body.orders);
            },
            {
                role: "admin",
                body: t.Object({
                    orders: t.Array(
                        t.Object({
                            id: t.String({ minLength: 24, maxLength: 24 }),
                            order: t.Number(),
                        })
                    ),
                }),
                detail: {
                    summary: "Batch Reorder Flags",
                    tags: ["Flags"],
                },
            }
        )
        .patch(
            "/:id",
            async ({ params, body }) => {
                return await updateFlagUseCase.execute(params.id, body as UpdateFlagInput);
            },
            {
                role: "admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                body: t.Object({
                    type: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
                    identifier: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
                    description: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
                    tag: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
                    backgroundColor: t.Optional(t.String({ minLength: 4, maxLength: 20 })),
                    textColor: t.Optional(t.String({ minLength: 4, maxLength: 20 })),
                    isActive: t.Optional(t.Boolean()),
                    order: t.Optional(t.Number()),
                }),
                detail: {
                    summary: "Update an Existing Flag",
                    tags: ["Flags"],
                },
            }
        )
        .delete(
            "/:id",
            async ({ params }) => {
                return await deleteFlagUseCase.execute(params.id);
            },
            {
                role: "admin",
                params: t.Object({
                    id: t.String({ minLength: 24, maxLength: 24 }),
                }),
                detail: {
                    summary: "Delete a Flag",
                    tags: ["Flags"],
                },
            }
        );
};

export const flagModule = createFlagModule();
