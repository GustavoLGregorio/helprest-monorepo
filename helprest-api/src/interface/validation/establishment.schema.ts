import { z } from "zod/v4";

const locationSchema = z.object({
    state: z.string().min(1),
    city: z.string().min(1),
    neighborhood: z.string().optional().default(""),
    address: z.string().min(1),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
});

export const createEstablishmentSchema = z.object({
    companyName: z.string().min(2).max(200),
    location: locationSchema,
    flagIds: z.array(z.string().min(1)),
    logo: z.url(),
});

export const listEstablishmentsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const nearbyEstablishmentsSchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    maxDistance: z.coerce.number().int().min(100).max(100_000).default(10_000),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchEstablishmentsSchema = z.object({
    q: z.string().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>;
export type ListEstablishmentsInput = z.infer<typeof listEstablishmentsSchema>;
export type NearbyEstablishmentsInput = z.infer<typeof nearbyEstablishmentsSchema>;
export type SearchEstablishmentsInput = z.infer<typeof searchEstablishmentsSchema>;
