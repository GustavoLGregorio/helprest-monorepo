import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Role } from "@domain/value-objects/Role";
import type { RoleType } from "@domain/value-objects/Role";
import { UnauthorizedError, ForbiddenError } from "@shared/errors";

export interface AuthenticatedUserPayload {
    sub: string;
    email: string;
    role: RoleType;
}

export const authPlugin = new Elysia({ name: "auth-plugin" })
    .use(bearer())
    .use(
        jwt({
            name: "jwtService",
            secret: process.env.JWT_SECRET ?? "helprest-jwt-secret-default",
        })
    )
    .macro({
        role(requiredRole: RoleType) {
            return {
                async beforeHandle({ bearer, jwtService }) {
                    if (!bearer) {
                        throw new UnauthorizedError("Missing or invalid Authorization header");
                    }
                    const payload = await jwtService.verify(bearer);
                    if (!payload || typeof payload !== "object" || !payload.sub) {
                        throw new UnauthorizedError("Invalid or expired token");
                    }

                    const userRole = Role.create((payload as Record<string, unknown>).role as string);
                    if (!userRole.hasPermission(requiredRole)) {
                        throw new ForbiddenError(`Insufficient permissions. Required role level: ${requiredRole}`);
                    }
                },
            };
        },
    });
