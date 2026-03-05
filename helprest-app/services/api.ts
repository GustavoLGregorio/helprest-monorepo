import { loadTokens, saveTokens, clearTokens } from "@/storage/authTokens";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
    body?: Record<string, unknown>;
    authenticated?: boolean;
    headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    ok: boolean;
}

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
        if (tokens?.accessToken) {
            headers["Authorization"] = `Bearer ${tokens.accessToken}`;
        }
    }

    let response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    // Auto-refresh on 401
    if (response.status === 401 && authenticated) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            response = await fetch(`${API_URL}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
        }
    }

    const data = (await response.json()) as T;
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
