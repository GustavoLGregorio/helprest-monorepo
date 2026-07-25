import { connectToDatabase, disconnectDatabase } from "@infra/database/mongodb/connection";
import { disconnectRedis } from "@infra/database/redis/connection";
import { createIndexes } from "@infra/database/mongodb/indexes";
import { handleRequest } from "@interface/http/router";
import { logger } from "@shared/utils/logger";

const PORT = Number(process.env.PORT) || 3000;

async function main() {
    logger.info("Starting HelpRest API...");

    // Connect to MongoDB
    await connectToDatabase();
    await createIndexes();

    // Note: Redis is lazy-connected on first use.
    // If Redis is not available, the app still works without caching/rate limiting.

    const server = Bun.serve({
        port: PORT,
        fetch: handleRequest,
    });

    logger.info(`HelpRest API running on http://localhost:${server.port}`);

    let isShuttingDown = false;

    const gracefulShutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        logger.info(`Received ${signal}. Initiating graceful shutdown...`);

        // Timeout to force exit if connections fail to close within 10 seconds
        const forceExitTimeout = setTimeout(() => {
            logger.error("Graceful shutdown timed out. Forcing process exit.");
            process.exit(1);
        }, 10_000);

        try {
            logger.info("Stopping HTTP server...");
            server.stop();

            logger.info("Closing MongoDB connection pool...");
            await disconnectDatabase();

            logger.info("Closing Redis connection...");
            await disconnectRedis();

            logger.info("Graceful shutdown completed successfully.");
            clearTimeout(forceExitTimeout);
            process.exit(0);
        } catch (error) {
            logger.error("Error during graceful shutdown", { error: String(error) });
            clearTimeout(forceExitTimeout);
            process.exit(1);
        }
    };

    process.on("SIGINT", () => {
        void gracefulShutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
        void gracefulShutdown("SIGTERM");
    });
}

main().catch((error) => {
    logger.error("Failed to start server", { error: String(error) });
    process.exit(1);
});
