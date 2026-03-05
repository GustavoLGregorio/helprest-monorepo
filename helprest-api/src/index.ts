import { connectToDatabase, disconnectDatabase } from "@infra/database/mongodb/connection";
import { createIndexes } from "@infra/database/mongodb/indexes";
import { handleRequest } from "@interface/http/router";
import { logger } from "@shared/utils/logger";

const PORT = Number(process.env.PORT) || 3000;

async function main() {
    logger.info("Starting HelpRest API...");

    // Connect to MongoDB
    await connectToDatabase();
    await createIndexes();

    // Note: Redis is lazy-connected (on first use).
    // If Redis is not available, the app still works without caching/rate limiting.

    const server = Bun.serve({
        port: PORT,
        fetch: handleRequest,
    });

    logger.info(`HelpRest API running on http://localhost:${server.port}`);

    // Graceful shutdown
    process.on("SIGINT", async () => {
        logger.info("Shutting down...");
        await disconnectDatabase();
        process.exit(0);
    });

    process.on("SIGTERM", async () => {
        logger.info("Shutting down...");
        await disconnectDatabase();
        process.exit(0);
    });
}

main().catch((error) => {
    logger.error("Failed to start server", { error: String(error) });
    process.exit(1);
});
