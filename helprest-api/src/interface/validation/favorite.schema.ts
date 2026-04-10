import { z } from "zod";

export const addFavoriteSchema = z.object({
    referenceId: z.string().min(24).max(24),
    type: z.enum(["establishment", "product"])
});

export const getFavoritesSchema = z.object({});
