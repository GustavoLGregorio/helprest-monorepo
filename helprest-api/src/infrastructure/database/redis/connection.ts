import Redis from "ioredis";
import { logger } from "@shared/utils/logger";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (redis) return redis;

    const url = process.env.REDIS_URL ?? "redis://localhost:6379";

    redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 5) return null; // Stop retrying after 5 attempts
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
    });

    redis.on("connect", () => {
        logger.info("Connected to Redis");
    });

    redis.on("error", (err) => {
        logger.error("Redis connection error", { error: String(err) });
    });

    return redis;
}

export async function connectRedis(): Promise<void> {
    const client = getRedisClient();
    await client.connect();
}

export async function disconnectRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
        logger.info("Disconnected from Redis");
    }
}
