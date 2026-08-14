import { loadTokens, saveTokens, clearTokens } from "@/storage/authTokens";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
    body?: Record<string, unknown>;
    authenticated?: boolean;
    headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    ok: boolean;
}

// Single-flight Mutex promise to deduplicate concurrent token refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const tokens = loadTokens();
    if (!tokens?.refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!response.ok) {
            clearTokens();
            return null;
        }

        const data = (await response.json()) as {
            accessToken: string;
            refreshToken: string;
        };
        saveTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        });
        return data.accessToken;
    } catch {
        clearTokens();
        return null;
    }
}

/**
 * Thread-safe / Concurrency-safe Token Refresh Mutex.
 * Ensures that if multiple concurrent requests encounter a 401 Unauthorized,
 * only one single HTTP POST /api/auth/refresh call is dispatched over the wire.
 */
export async function getOrRefreshAccessToken(): Promise<string | null> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            return await refreshAccessToken();
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function request<T = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
): Promise<ApiResponse<T>> {
    const { body, authenticated = false, headers: extraHeaders } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...extraHeaders,
    };

    if (authenticated) {
        const tokens = loadTokens();
        if (!tokens?.accessToken) {
            // No token available — fail fast instead of sending an unauthenticated request
            throw new Error("No access token available. User must be logged in.");
        }
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    let response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Auto-refresh with Mutex on 401 for authenticated requests
    if (response.status === 401 && authenticated) {
        const newToken = await getOrRefreshAccessToken();
        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            response = await fetch(`${API_URL}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
        }
    }

    let data: T;
    try {
        data = (await response.json()) as T;
    } catch {
        data = {} as T;
    }

    return { data, status: response.status, ok: response.ok };
}

export const api = {
    get: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>("GET", path, options),

    post: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>("POST", path, options),

    patch: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>("PATCH", path, options),

    put: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>("PUT", path, options),

    delete: <T = unknown>(path: string, options?: RequestOptions) =>
        request<T>("DELETE", path, options),
};
