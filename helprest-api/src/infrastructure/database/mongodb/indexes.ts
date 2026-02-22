import { getDatabase } from "./connection";
import { COLLECTION_NAMES } from "./collections";
import { logger } from "@shared/utils/logger";

/**
 * Creates all required indexes for optimal query performance.
 * Should be called once on server startup after database connection.
 */
export async function createIndexes(): Promise<void> {
    const db = getDatabase();

    // Users: unique email index
    await db.collection(COLLECTION_NAMES.USERS).createIndex(
        { email: 1 },
        { unique: true, name: "idx_users_email" },
    );

    // Establishments: 2dsphere index for geospatial queries ($geoNear)
    await db.collection(COLLECTION_NAMES.ESTABLISHMENTS).createIndex(
        { "location.coordinates": "2dsphere" },
        { name: "idx_establishments_geo" },
    );

    // Establishments: flags index for flag-based filtering
    await db.collection(COLLECTION_NAMES.ESTABLISHMENTS).createIndex(
        { flags: 1 },
        { name: "idx_establishments_flags" },
    );

    // Establishments: text index for search
    await db.collection(COLLECTION_NAMES.ESTABLISHMENTS).createIndex(
        { companyName: "text" },
        { name: "idx_establishments_text" },
    );

    // Establishments: sponsored + rating for sponsored listing
    await db.collection(COLLECTION_NAMES.ESTABLISHMENTS).createIndex(
        { isSponsored: 1, rating: -1 },
        { name: "idx_establishments_sponsored" },
    );

    // Visits: compound index for user visit history
    await db.collection(COLLECTION_NAMES.VISITS).createIndex(
        { userId: 1, date: -1 },
        { name: "idx_visits_user" },
    );

    // Visits: index for establishment reviews
    await db.collection(COLLECTION_NAMES.VISITS).createIndex(
        { establishmentId: 1, date: -1 },
        { name: "idx_visits_establishment" },
    );

    // Flags: index by type
    await db.collection(COLLECTION_NAMES.FLAGS).createIndex(
        { type: 1 },
        { name: "idx_flags_type" },
    );

    logger.info("Database indexes created successfully");
}
