import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { ListFlags, CreateFlag } from "@application/use-cases/flag";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import type { IFlagRepository } from "@domain/repositories/IFlagRepository";
import type { CreateFlagInput } from "@interface/validation/flag.schema";

export const createFlagModule = (
    flagRepo: IFlagRepository = new MongoFlagRepository()
) => {
    const listFlagsUseCase = new ListFlags(flagRepo);
    const createFlagUseCase = new CreateFlag(flagRepo);

    return new Elysia({ prefix: "/api/flags", name: "flag-module" })
        .use(authPlugin)
        .get(
            "",
            async () => {
                return await listFlagsUseCase.execute();
            },
            {
                detail: {
                    summary: "List All Dietary and Accessibility Flags",
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
                    backgroundColor: t.RegExp(/^#([0-9a-fA-F]{3}){1,2}$/),
                    textColor: t.RegExp(/^#([0-9a-fA-F]{3}){1,2}$/),
                }),
                detail: {
                    summary: "Create New Flag (Admin only)",
                    tags: ["Flags"],
                },
            }
        );
};

export const flagModule = createFlagModule();
