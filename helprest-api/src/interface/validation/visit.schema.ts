import { z } from "zod/v4";

export const createVisitSchema = z.object({
    establishmentId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    review: z.string().min(1).max(2000),
    date: z.iso.date().optional(),
    photoUrls: z.array(z.string()).optional(),
    coordinates: z
        .object({
            lat: z.coerce.number().min(-90).max(90),
            lng: z.coerce.number().min(-180).max(180),
        })
        .optional(),
});

export const listVisitsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const socialFeedSchema = z.object({
    lat: z.coerce.number().min(-90).max(90).default(0),
    lng: z.coerce.number().min(-180).max(180).default(0),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(15),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type ListVisitsInput = z.infer<typeof listVisitsSchema>;
export type SocialFeedInput = z.infer<typeof socialFeedSchema>;
