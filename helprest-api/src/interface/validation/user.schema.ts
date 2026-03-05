import { z } from "zod/v4";

const locationSchema = z.object({
    state: z.string().optional().default(""),
    city: z.string().optional().default(""),
    neighborhood: z.string().optional().default(""),
    address: z.string().min(1),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
});

const socialLinksSchema = z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
    website: z.url().optional(),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    birthDate: z.iso.date().optional(),
    location: locationSchema.optional(),
    socialLinksEnabled: z.boolean().optional(),
    socialLinks: socialLinksSchema.optional(),
    profilePhoto: z.string().optional(),
});

export const updateFlagsSchema = z.object({
    flagIds: z.array(z.string().min(1)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateFlagsInput = z.infer<typeof updateFlagsSchema>;
