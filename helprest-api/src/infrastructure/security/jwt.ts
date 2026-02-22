import * as jose from "jose";

const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION ?? "15m";
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION ?? "7d";

function getAccessSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET environment variable is not set");
    return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET environment variable is not set");
    return new TextEncoder().encode(secret);
}

export interface TokenPayload {
    sub: string; // User ID
    email: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * Generates a JWT access + refresh token pair.
 */
export async function generateTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = await new jose.SignJWT({ email: payload.email })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(ACCESS_EXPIRATION)
        .setIssuer("helprest-api")
        .sign(getAccessSecret());

    const refreshToken = await new jose.SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(REFRESH_EXPIRATION)
        .setIssuer("helprest-api")
        .sign(getRefreshSecret());

    return { accessToken, refreshToken };
}

/**
 * Verifies an access token and returns the decoded payload.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
    const { payload } = await jose.jwtVerify(token, getAccessSecret(), {
        issuer: "helprest-api",
    });

    return {
        sub: payload.sub!,
        email: payload.email as string,
    };
}

/**
 * Verifies a refresh token and returns the user ID (sub).
 */
export async function verifyRefreshToken(token: string): Promise<string> {
    const { payload } = await jose.jwtVerify(token, getRefreshSecret(), {
        issuer: "helprest-api",
    });

    return payload.sub!;
}
