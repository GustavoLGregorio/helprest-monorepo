const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "*").split(",");

/**
 * Applies CORS headers to a response.
 */
export function applyCorsHeaders(request: Request, headers: Headers): void {
    const origin = request.headers.get("Origin") ?? "";

    if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
        headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes("*") ? "*" : origin);
    }

    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "86400");
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 */
export function handlePreflight(request: Request): Response | null {
    if (request.method !== "OPTIONS") return null;

    const headers = new Headers();
    applyCorsHeaders(request, headers);
    return new Response(null, { status: 204, headers });
}
