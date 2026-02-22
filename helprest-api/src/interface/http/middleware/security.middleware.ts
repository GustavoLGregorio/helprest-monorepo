/**
 * Applies security headers equivalent to Helmet.js.
 */
export function applySecurityHeaders(headers: Headers): void {
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "0"); // Deprecated, rely on CSP
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");

    if (process.env.NODE_ENV === "production") {
        headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
}
