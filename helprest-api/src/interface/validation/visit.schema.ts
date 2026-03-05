import { z } from "zod/v4";

export const createVisitSchema = z.object({
    establishmentId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    review: z.string().min(1).max(2000),
    date: z.iso.date().optional(),
});

export const listVisitsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type ListVisitsInput = z.infer<typeof listVisitsSchema>;
