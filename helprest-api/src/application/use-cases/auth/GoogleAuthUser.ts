import * as jose from "jose";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { User } from "@domain/entities/User";
import { generateTokens } from "@infra/security/jwt";
import type { TokenPair } from "@infra/security/jwt";
import { UnauthorizedError } from "@shared/errors";

// Google's public JWK Set for verifying ID tokens
const GOOGLE_JWKS = jose.createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleAuthInput {
    googleIdToken: string;
}

export interface GoogleAuthResult {
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        profilePhoto?: string;
    };
}

export class GoogleAuthUser {
    constructor(private readonly userRepo: IUserRepository) { }

    async execute(input: GoogleAuthInput): Promise<GoogleAuthResult> {
        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
        if (!clientId) {
            throw new Error("GOOGLE_OAUTH_CLIENT_ID environment variable is not set");
        }

        // Verify the Google ID token with Google's public keys
        let payload: jose.JWTPayload;
        try {
            const result = await jose.jwtVerify(input.googleIdToken, GOOGLE_JWKS, {
                issuer: GOOGLE_ISSUERS,
                audience: clientId,
            });
            payload = result.payload;
        } catch (error) {
            throw new UnauthorizedError("Invalid Google ID token");
        }

        // Extract claims from the verified token
        const googleId = payload.sub;
        const email = payload.email as string;
        const emailVerified = payload.email_verified as boolean;
        const name = (payload.name as string) || "User";
        const picture = payload.picture as string | undefined;

        if (!googleId || !email) {
            throw new UnauthorizedError("Google token missing required claims");
        }

        if (!emailVerified) {
            throw new UnauthorizedError("Google email is not verified");
        }

        // Try to find existing user by Google ID
        let user = await this.userRepo.findByGoogleId(googleId);
        let isNewUser = false;

        if (!user) {
            // Fallback: try to find by email (link existing account)
            user = await this.userRepo.findByEmail(email);

            if (user) {
                // Link Google to existing email-based account
                const linkedUser = User.create({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    authProvider: "google",
                    googleId,
                    birthDate: user.birthDate,
                    flags: [...user.flags],
                    location: user.location,
                    socialLinksEnabled: user.socialLinksEnabled,
                    socialLinks: user.socialLinks,
                    profilePhoto: user.profilePhoto || picture,
                    createdAt: user.createdAt,
                    updatedAt: new Date(),
                });
                await this.userRepo.update(linkedUser);
                user = linkedUser;
            } else {
                // Create new user from Google data
                isNewUser = true;
                user = User.create({
                    name,
                    email,
                    authProvider: "google",
                    googleId,
                    profilePhoto: picture,
                    flags: [],
                    socialLinksEnabled: false,
                });
                await this.userRepo.create(user);
            }
        }

        const tokens: TokenPair = await generateTokens({
            sub: user.id.toHexString(),
            email: user.email,
        });

        return {
            ...tokens,
            isNewUser,
            user: {
                id: user.id.toHexString(),
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
            },
        };
    }
}
