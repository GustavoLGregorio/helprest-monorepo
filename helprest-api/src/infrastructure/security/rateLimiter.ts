import { getRedisClient } from "../database/redis/connection";
import { RateLimitError } from "@shared/errors";

interface RateLimitConfig {
    windowMs: number;   // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60_000,   // 1 minute
    maxRequests: 100,    // 100 requests per minute
};

/**
 * Sliding window rate limiter using Redis.
 * Returns true if the request is allowed, throws RateLimitError if exceeded.
 */
export async function checkRateLimit(
    key: string,
    config: RateLimitConfig = DEFAULT_CONFIG,
): Promise<void> {
    const redis = getRedisClient();
    const redisKey = `rate_limit:${key}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Atomic pipeline: remove old entries, add new, count, set expiry
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.pexpire(redisKey, config.windowMs);

    const results = await pipeline.exec();
    const requestCount = results?.[2]?.[1] as number;

    if (requestCount > config.maxRequests) {
        throw new RateLimitError(`Rate limit exceeded: ${config.maxRequests} requests per ${config.windowMs / 1000}s`);
    }
}

/**
 * Rate limit configurations for different endpoints.
 */
export const RATE_LIMITS = {
    AUTH: { windowMs: 60_000, maxRequests: 10 },    // 10 auth attempts/min
    API: { windowMs: 60_000, maxRequests: 100 },    // 100 API calls/min
    SEARCH: { windowMs: 60_000, maxRequests: 30 },  // 30 searches/min
} as const;
