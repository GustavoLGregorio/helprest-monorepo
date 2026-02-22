import { getRedisClient } from "../database/redis/connection";

/**
 * Simple cache service wrapping Redis GET/SET with TTL.
 */
export class RedisCacheService {
    private prefix: string;

    constructor(prefix: string = "cache") {
        this.prefix = prefix;
    }

    private key(id: string): string {
        return `${this.prefix}:${id}`;
    }

    async get<T>(id: string): Promise<T | null> {
        const redis = getRedisClient();
        const data = await redis.get(this.key(id));
        if (!data) return null;
        return JSON.parse(data) as T;
    }

    async set<T>(id: string, value: T, ttlSeconds: number = 300): Promise<void> {
        const redis = getRedisClient();
        await redis.setex(this.key(id), ttlSeconds, JSON.stringify(value));
    }

    async delete(id: string): Promise<void> {
        const redis = getRedisClient();
        await redis.del(this.key(id));
    }

    async invalidatePrefix(pattern: string): Promise<void> {
        const redis = getRedisClient();
        const keys = await redis.keys(`${this.prefix}:${pattern}*`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
}
