import { z } from "zod/v4";

export const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.email(),
    password: z.string().min(8).max(128),
    birthDate: z.iso.date(),
    flagIds: z.array(z.string()).optional().default([]),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
