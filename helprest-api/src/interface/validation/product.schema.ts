import { z } from "zod/v4";

export const createProductSchema = z.object({
    establishmentId: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(500).optional().default(""),
    price: z.coerce.number().min(0),
    imageUrl: z.string().nullable().optional(),
    ingredients: z.array(z.string().max(150)).max(30).optional().default([]),
    flags: z.array(z.string().min(1)).optional().default([]),
});

export const updateProductSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    price: z.coerce.number().min(0).optional(),
    imageUrl: z.string().nullable().optional(),
    ingredients: z.array(z.string().max(150)).max(30).optional(),
    flags: z.array(z.string().min(1)).optional(),
    isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
