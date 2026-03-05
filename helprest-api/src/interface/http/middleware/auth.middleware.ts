import { verifyAccessToken } from "@infra/security/jwt";
import { UnauthorizedError } from "@shared/errors";
import type { TokenPayload } from "@infra/security/jwt";

/**
 * Extracts and verifies the JWT token from the Authorization header.
 * Returns the decoded payload if valid, throws UnauthorizedError otherwise.
 */
export async function authenticateRequest(request: Request): Promise<TokenPayload> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    try {
        return await verifyAccessToken(token);
    } catch {
        throw new UnauthorizedError("Invalid or expired token");
    }
}
