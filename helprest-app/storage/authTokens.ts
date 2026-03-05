import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "auth-tokens" });

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface GoogleUserInfo {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
}

export const saveTokens = (tokens: AuthTokens): void => {
    try {
        storage.set("accessToken", tokens.accessToken);
        storage.set("refreshToken", tokens.refreshToken);
    } catch (error) {
        console.error("Error saving auth tokens:", error);
    }
};

export const loadTokens = (): AuthTokens | null => {
    try {
        const accessToken = storage.getString("accessToken");
        const refreshToken = storage.getString("refreshToken");
        if (accessToken && refreshToken) {
            return { accessToken, refreshToken };
        }
        return null;
    } catch (error) {
        console.error("Error loading auth tokens:", error);
        return null;
    }
};

export const clearTokens = (): void => {
    try {
        storage.delete("accessToken");
        storage.delete("refreshToken");
    } catch (error) {
        console.error("Error clearing auth tokens:", error);
    }
};

export const isAuthenticated = (): boolean => {
    return loadTokens() !== null;
};

export const saveGoogleUserInfo = (user: GoogleUserInfo): void => {
    try {
        storage.set("googleUser", JSON.stringify(user));
    } catch (error) {
        console.error("Error saving google user info:", error);
    }
};

export const loadGoogleUserInfo = (): GoogleUserInfo | null => {
    try {
        const raw = storage.getString("googleUser");
        if (raw) return JSON.parse(raw) as GoogleUserInfo;
        return null;
    } catch (error) {
        console.error("Error loading google user info:", error);
        return null;
    }
};

export const clearGoogleUserInfo = (): void => {
    try {
        storage.delete("googleUser");
    } catch (error) {
        console.error("Error clearing google user info:", error);
    }
};
