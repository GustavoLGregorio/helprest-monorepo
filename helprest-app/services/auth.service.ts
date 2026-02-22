import { apiFetch, saveTokens, clearTokens } from "./api.config";
import type { TokenPair, UserProfileDTO } from "@/types/api.types";

export async function register(input: {
    name: string;
    email: string;
    password: string;
    birthDate: string;
}): Promise<TokenPair> {
    const tokens = await apiFetch<TokenPair>("/auth/register", {
        method: "POST",
        body: input,
        authenticated: false,
    });
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
}

export async function login(email: string, password: string): Promise<TokenPair> {
    const tokens = await apiFetch<TokenPair>("/auth/login", {
        method: "POST",
        body: { email, password },
        authenticated: false,
    });
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
}

export async function logout(): Promise<void> {
    await clearTokens();
}

export async function getProfile(): Promise<UserProfileDTO> {
    return apiFetch<UserProfileDTO>("/users/me");
}

export async function updateProfile(
    data: Partial<Pick<UserProfileDTO, "name" | "location" | "socialLinksEnabled" | "socialLinks" | "profilePhoto">>,
): Promise<UserProfileDTO> {
    return apiFetch<UserProfileDTO>("/users/me", {
        method: "PATCH",
        body: data,
    });
}

export async function updateFlags(flagIds: string[]): Promise<void> {
    await apiFetch("/users/me/flags", {
        method: "PATCH",
        body: { flagIds },
    });
}
