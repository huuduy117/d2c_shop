import dotenv from "dotenv";
import { Redis } from "@upstash/redis";

dotenv.config({ path: ".env.local" });

const redis = Redis.fromEnv();

export async function getRedisClient() {
  return redis;
}

export async function rateLimit(key: string, limit = 5, windowSeconds = 900) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return {
    success: count <= limit,
    count,
    remaining: Math.max(limit - count, 0),
    resetSeconds: windowSeconds,
  };
}

export async function resetRateLimit(key: string) {
  await redis.del(key);
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const value = await redis.get<string>(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60) {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  await redis.set(key, payload, { ex: ttlSeconds });
}
