import { z } from "zod/v4";

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});

export const googleAuthSchema = z.object({
    googleIdToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
