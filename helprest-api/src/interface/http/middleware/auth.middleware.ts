import { verifyAccessToken } from "@infra/security/jwt";
import { UnauthorizedError, ForbiddenError } from "@shared/errors";
import type { TokenPayload } from "@infra/security/jwt";
import { Role } from "@domain/value-objects/Role";
import type { RoleType } from "@domain/value-objects/Role";

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

/**
 * Verifies that the authenticated request carries at least the required role permission.
 * Throws ForbiddenError if the role hierarchy level is insufficient.
 */
export function authorizeRole(payload: TokenPayload, requiredRole: RoleType): void {
    const userRole = Role.create(payload.role);
    if (!userRole.hasPermission(requiredRole)) {
        throw new ForbiddenError(`Insufficient permissions. Required role level: ${requiredRole}`);
    }
}
