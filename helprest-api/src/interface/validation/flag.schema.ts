import { z } from "zod/v4";

export const createFlagSchema = z.object({
    type: z.string().min(1).max(50),
    identifier: z.string().min(1).max(50),
    description: z.string().min(1).max(500),
    tag: z.string().min(1).max(50),
    backgroundColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color format"),
    textColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color format"),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
