import { sanitize } from "@shared/utils/sanitize";
import { logger, generateRequestId } from "@shared/utils/logger";
import { handlePreflight, applyCorsHeaders } from "./middleware/cors.middleware";
import { applySecurityHeaders } from "./middleware/security.middleware";
import { handleError } from "./middleware/error.middleware";
import { authenticateRequest } from "./middleware/auth.middleware";
import { ValidationError } from "@shared/errors";
import type { ZodType } from "zod/v4";

// Repositories
import { MongoUserRepository } from "@infra/repositories/MongoUserRepository";
import { MongoEstablishmentRepository } from "@infra/repositories/MongoEstablishmentRepository";
import { MongoFlagRepository } from "@infra/repositories/MongoFlagRepository";
import { MongoVisitRepository } from "@infra/repositories/MongoVisitRepository";

// Use Cases — Auth
import { RegisterUser, LoginUser, RefreshToken } from "@application/use-cases/auth";
import { GoogleAuthUser } from "@application/use-cases/auth/GoogleAuthUser";

// Use Cases — User
import { GetUserProfile, UpdateUserProfile, UpdateUserFlags } from "@application/use-cases/user";

// Use Cases — Establishment
import {
    ListEstablishments,
    GetEstablishment,
    GetRecommendedEstablishments,
    GetNearbyEstablishments,
    SearchEstablishments,
    CreateEstablishment,
} from "@application/use-cases/establishment";

// Use Cases — Flag
import { ListFlags, CreateFlag } from "@application/use-cases/flag";

// Use Cases — Visit
import { CreateVisit, ListUserVisits, GetEstablishmentVisits } from "@application/use-cases/visit";

// Validation schemas
import { registerSchema, loginSchema, refreshTokenSchema, googleAuthSchema } from "@interface/validation/auth.schema";
import { updateProfileSchema, updateFlagsSchema } from "@interface/validation/user.schema";
import {
    createEstablishmentSchema,
    listEstablishmentsSchema,
    nearbyEstablishmentsSchema,
    searchEstablishmentsSchema,
} from "@interface/validation/establishment.schema";
import { createVisitSchema, listVisitsSchema } from "@interface/validation/visit.schema";

// ── Singleton repository instances ──
const userRepo = new MongoUserRepository();
const estRepo = new MongoEstablishmentRepository();
const flagRepo = new MongoFlagRepository();
const visitRepo = new MongoVisitRepository();

// ── Helpers ──

async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
    const raw = await request.json();
    const sanitized = sanitize(raw);
    const result = schema.safeParse(sanitized);
    if (!result.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
            const path = issue.path.join(".");
            if (!fieldErrors[path]) fieldErrors[path] = [];
            fieldErrors[path]!.push(issue.message);
        }
        throw new ValidationError("Validation failed", fieldErrors);
    }
    return result.data;
}

function parseQuery<T>(url: URL, schema: ZodType<T>): T {
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    const result = schema.safeParse(params);
    if (!result.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
            const path = issue.path.join(".");
            if (!fieldErrors[path]) fieldErrors[path] = [];
            fieldErrors[path]!.push(issue.message);
        }
        throw new ValidationError("Invalid query parameters", fieldErrors);
    }
    return result.data;
}

function json(data: unknown, status = 200): Response {
    return Response.json(data, { status });
}

type RouteHandler = (
    request: Request,
    url: URL,
    params: Record<string, string>,
) => Promise<Response>;

interface Route {
    method: string;
    pattern: RegExp;
    paramNames: string[];
    handler: RouteHandler;
}

// ── Route Registration ──

const routes: Route[] = [];

function addRoute(method: string, path: string, handler: RouteHandler) {
    const paramNames: string[] = [];
    const regexPattern = path.replace(/:(\w+)/g, (_match, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
    });
    routes.push({
        method,
        pattern: new RegExp(`^${regexPattern}$`),
        paramNames,
        handler,
    });
}

function matchRoute(method: string, pathname: string) {
    for (const route of routes) {
        if (route.method !== method) continue;
        const match = pathname.match(route.pattern);
        if (match) {
            const params: Record<string, string> = {};
            route.paramNames.forEach((name, i) => {
                params[name] = match[i + 1]!;
            });
            return { handler: route.handler, params };
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════
//  AUTH ROUTES (public)
// ═══════════════════════════════════════════════════════

addRoute("POST", "/api/auth/register", async (req) => {
    const input = await parseBody(req, registerSchema);
    const useCase = new RegisterUser(userRepo);
    const tokens = await useCase.execute(input);
    return json(tokens, 201);
});

addRoute("POST", "/api/auth/login", async (req) => {
    const input = await parseBody(req, loginSchema);
    const useCase = new LoginUser(userRepo);
    const tokens = await useCase.execute(input);
    return json(tokens);
});

addRoute("POST", "/api/auth/refresh", async (req) => {
    const input = await parseBody(req, refreshTokenSchema);
    const useCase = new RefreshToken(userRepo);
    const tokens = await useCase.execute(input.refreshToken);
    return json(tokens);
});

addRoute("POST", "/api/auth/google", async (req) => {
    const input = await parseBody(req, googleAuthSchema);
    const useCase = new GoogleAuthUser(userRepo);
    const result = await useCase.execute(input);
    return json(result);
});

// ═══════════════════════════════════════════════════════
//  USER ROUTES (authenticated)
// ═══════════════════════════════════════════════════════

addRoute("GET", "/api/users/me", async (req) => {
    const auth = await authenticateRequest(req);
    const useCase = new GetUserProfile(userRepo);
    const profile = await useCase.execute(auth.sub);
    return json(profile);
});

addRoute("PATCH", "/api/users/me", async (req) => {
    const auth = await authenticateRequest(req);
    const input = await parseBody(req, updateProfileSchema);
    const useCase = new UpdateUserProfile(userRepo);
    const result = await useCase.execute(auth.sub, input);
    return json(result);
});

addRoute("PATCH", "/api/users/me/flags", async (req) => {
    const auth = await authenticateRequest(req);
    const input = await parseBody(req, updateFlagsSchema);
    const useCase = new UpdateUserFlags(userRepo, flagRepo);
    const result = await useCase.execute(auth.sub, input);
    return json(result);
});

// ═══════════════════════════════════════════════════════
//  ESTABLISHMENT ROUTES (authenticated)
// ═══════════════════════════════════════════════════════

addRoute("GET", "/api/establishments", async (req, url) => {
    await authenticateRequest(req);
    const input = parseQuery(url, listEstablishmentsSchema);
    const useCase = new ListEstablishments(estRepo, flagRepo);
    const result = await useCase.execute(input);
    return json(result);
});

addRoute("GET", "/api/establishments/recommended", async (req, url) => {
    const auth = await authenticateRequest(req);
    const params = parseQuery(url, nearbyEstablishmentsSchema);
    const useCase = new GetRecommendedEstablishments(estRepo, userRepo, flagRepo);
    const result = await useCase.execute(auth.sub, params.lat, params.lng, params.limit);
    return json(result);
});

addRoute("GET", "/api/establishments/nearby", async (req, url) => {
    await authenticateRequest(req);
    const input = parseQuery(url, nearbyEstablishmentsSchema);
    const useCase = new GetNearbyEstablishments(estRepo, flagRepo);
    const result = await useCase.execute(input);
    return json(result);
});

addRoute("GET", "/api/establishments/search", async (req, url) => {
    await authenticateRequest(req);
    const input = parseQuery(url, searchEstablishmentsSchema);
    const useCase = new SearchEstablishments(estRepo, flagRepo);
    const result = await useCase.execute(input);
    return json(result);
});

addRoute("GET", "/api/establishments/:id", async (req, _url, params) => {
    await authenticateRequest(req);
    const useCase = new GetEstablishment(estRepo, flagRepo);
    const result = await useCase.execute(params.id!);
    return json(result);
});

addRoute("POST", "/api/establishments", async (req) => {
    await authenticateRequest(req);
    const input = await parseBody(req, createEstablishmentSchema);
    const useCase = new CreateEstablishment(estRepo);
    const result = await useCase.execute(input);
    return json(result, 201);
});

// ═══════════════════════════════════════════════════════
//  FLAG ROUTES (public listing)
// ═══════════════════════════════════════════════════════

addRoute("GET", "/api/flags", async () => {
    const useCase = new ListFlags(flagRepo);
    const result = await useCase.execute();
    return json(result);
});

addRoute("POST", "/api/flags", async (req) => {
    await authenticateRequest(req);
    const body = await req.json() as Record<string, unknown>;
    const sanitized = sanitize(body) as { type: string; identifier: string; description: string; tag: string; backgroundColor: string; textColor: string };
    const useCase = new CreateFlag(flagRepo);
    const result = await useCase.execute(sanitized);
    return json(result, 201);
});

// ═══════════════════════════════════════════════════════
//  VISIT ROUTES (authenticated)
// ═══════════════════════════════════════════════════════

addRoute("POST", "/api/visits", async (req) => {
    const auth = await authenticateRequest(req);
    const input = await parseBody(req, createVisitSchema);
    const useCase = new CreateVisit(visitRepo, estRepo);
    const result = await useCase.execute(auth.sub, input);
    return json(result, 201);
});

addRoute("GET", "/api/visits/user/:userId", async (req, url, params) => {
    await authenticateRequest(req);
    const input = parseQuery(url, listVisitsSchema);
    const useCase = new ListUserVisits(visitRepo);
    const result = await useCase.execute(params.userId!, input);
    return json(result);
});

addRoute("GET", "/api/visits/establishment/:id", async (req, url, params) => {
    await authenticateRequest(req);
    const input = parseQuery(url, listVisitsSchema);
    const useCase = new GetEstablishmentVisits(visitRepo);
    const result = await useCase.execute(params.id!, input);
    return json(result);
});

// ═══════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════

addRoute("GET", "/api/health", async () => {
    return json({ status: "ok", timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════
//  MAIN REQUEST HANDLER
// ═══════════════════════════════════════════════════════

export async function handleRequest(request: Request): Promise<Response> {
    const requestId = generateRequestId();
    const start = performance.now();

    // Handle CORS preflight
    const preflightResponse = handlePreflight(request);
    if (preflightResponse) return preflightResponse;

    try {
        const url = new URL(request.url);
        const matched = matchRoute(request.method, url.pathname);

        if (!matched) {
            return json({ error: "Not Found", message: `${request.method} ${url.pathname} not found` }, 404);
        }

        const response = await matched.handler(request, url, matched.params);

        // Apply headers to response
        applyCorsHeaders(request, response.headers);
        applySecurityHeaders(response.headers);
        response.headers.set("X-Request-Id", requestId);

        const duration = Math.round(performance.now() - start);
        logger.info("Request completed", {
            requestId,
            method: request.method,
            path: url.pathname,
            status: response.status,
            durationMs: duration,
        });

        return response;
    } catch (error) {
        const errorResponse = handleError(error, requestId);
        applyCorsHeaders(request, errorResponse.headers);
        applySecurityHeaders(errorResponse.headers);
        errorResponse.headers.set("X-Request-Id", requestId);
        return errorResponse;
    }
}
