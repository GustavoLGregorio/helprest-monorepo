import { getDatabase } from "./connection";
import { COLLECTION_NAMES } from "./collections";
import { logger } from "@shared/utils/logger";

/**
 * Safely creates an index, ignoring "already exists" errors.
 */
async function ensureIndex(
    collectionName: string,
    spec: Record<string, unknown>,
    options: Record<string, unknown>,
): Promise<void> {
    try {
        const db = getDatabase();
        await db.collection(collectionName).createIndex(spec, options);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        // Skip if index already exists (same keys, different name or options)
        if (msg.includes("already exists")) {
            logger.info(`Index skipped (already exists): ${options.name ?? JSON.stringify(spec)}`);
            return;
        }
        throw error;
    }
}

/**
 * Creates all required indexes for optimal query performance.
 * Should be called once on server startup after database connection.
 */
export async function createIndexes(): Promise<void> {
    // Users: unique email index
    await ensureIndex(COLLECTION_NAMES.USERS, { email: 1 }, { unique: true, name: "idx_users_email" });

    // Establishments: 2dsphere index for geospatial queries ($geoNear)
    await ensureIndex(COLLECTION_NAMES.ESTABLISHMENTS, { "location.coordinates": "2dsphere" }, { name: "idx_establishments_geo" });

    // Establishments: flags index for flag-based filtering
    await ensureIndex(COLLECTION_NAMES.ESTABLISHMENTS, { flags: 1 }, { name: "idx_establishments_flags" });

    // Establishments: text index for search
    await ensureIndex(COLLECTION_NAMES.ESTABLISHMENTS, { companyName: "text" }, { name: "idx_establishments_text" });

    // Establishments: sponsored + rating for sponsored listing
    await ensureIndex(COLLECTION_NAMES.ESTABLISHMENTS, { isSponsored: 1, rating: -1 }, { name: "idx_establishments_sponsored" });

    // Visits: compound index for user visit history
    await ensureIndex(COLLECTION_NAMES.VISITS, { userId: 1, date: -1 }, { name: "idx_visits_user" });

    // Visits: index for establishment reviews
    await ensureIndex(COLLECTION_NAMES.VISITS, { establishmentId: 1, date: -1 }, { name: "idx_visits_establishment" });

    // Flags: index by type
    await ensureIndex(COLLECTION_NAMES.FLAGS, { type: 1 }, { name: "idx_flags_type" });

    logger.info("Database indexes verified");
}
