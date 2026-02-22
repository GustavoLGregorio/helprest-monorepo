import argon2 from "argon2";

/**
 * Hashes a plain-text password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,  // 64 MB
        timeCost: 3,
        parallelism: 2,
    });
}

/**
 * Verifies a plain-text password against an Argon2 hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
}
