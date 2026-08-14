import { MMKV } from "react-native-mmkv";
import { StorageKeys, StorageInstances } from "./keys";

const storage = new MMKV({ id: StorageInstances.AUTH });

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
        storage.set(StorageKeys.AUTH.ACCESS_TOKEN, tokens.accessToken);
        storage.set(StorageKeys.AUTH.REFRESH_TOKEN, tokens.refreshToken);
    } catch (error) {
        console.error("Error saving auth tokens:", error);
    }
};

export const loadTokens = (): AuthTokens | null => {
    try {
        const accessToken = storage.getString(StorageKeys.AUTH.ACCESS_TOKEN);
        const refreshToken = storage.getString(StorageKeys.AUTH.REFRESH_TOKEN);
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
        storage.delete(StorageKeys.AUTH.ACCESS_TOKEN);
        storage.delete(StorageKeys.AUTH.REFRESH_TOKEN);
    } catch (error) {
        console.error("Error clearing auth tokens:", error);
    }
};

export const isAuthenticated = (): boolean => {
    return loadTokens() !== null;
};

export const saveGoogleUserInfo = (user: GoogleUserInfo): void => {
    try {
        storage.set(StorageKeys.AUTH.GOOGLE_USER, JSON.stringify(user));
    } catch (error) {
        console.error("Error saving google user info:", error);
    }
};

export const loadGoogleUserInfo = (): GoogleUserInfo | null => {
    try {
        const raw = storage.getString(StorageKeys.AUTH.GOOGLE_USER);
        if (raw) return JSON.parse(raw) as GoogleUserInfo;
        return null;
    } catch (error) {
        console.error("Error loading google user info:", error);
        return null;
    }
};

export const clearGoogleUserInfo = (): void => {
    try {
        storage.delete(StorageKeys.AUTH.GOOGLE_USER);
    } catch (error) {
        console.error("Error clearing google user info:", error);
    }
};

/**
 * Clear all auth data (tokens + google user info).
 * Used on logout.
 */
export const clearAll = (): void => {
    clearTokens();
    clearGoogleUserInfo();
};
