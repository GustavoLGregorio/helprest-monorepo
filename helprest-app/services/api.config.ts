import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Configuration ──

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "helprest_access_token";
const REFRESH_KEY = "helprest_refresh_token";

// ── Token Management ──

export async function getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
        [TOKEN_KEY, accessToken],
        [REFRESH_KEY, refreshToken],
    ]);
}

export async function clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
}

// ── API Fetch Wrapper ──

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: Record<string, unknown>,
    ) {
        super(body.message as string ?? `API error ${status}`);
        this.name = "ApiError";
    }
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    authenticated?: boolean;
    query?: Record<string, string | number | undefined>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, authenticated = true, query } = options;

    // Build URL with query params
    let url = `${API_BASE_URL}${path}`;
    if (query) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params.set(key, String(value));
            }
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (authenticated) {
        const token = await getAccessToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        // Attempt token refresh on 401
        if (response.status === 401 && authenticated) {
            const refreshed = await attemptTokenRefresh();
            if (refreshed) {
                // Retry original request with new token
                return apiFetch<T>(path, options);
            }
        }

        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, errorBody as Record<string, unknown>);
    }

    return response.json() as Promise<T>;
}

// ── Token Refresh ──

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) return false;

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                await clearTokens();
                return false;
            }

            const data = await response.json() as { accessToken: string; refreshToken: string };
            await saveTokens(data.accessToken, data.refreshToken);
            return true;
        } catch {
            await clearTokens();
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}
