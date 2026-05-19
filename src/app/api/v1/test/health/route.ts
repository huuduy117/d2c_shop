import { NextResponse } from "next/server";
import { pool } from "@/lib/db/client";
import { getRedisClient } from "@/lib/cache/redis";

export async function GET() {
  try {
    const redis = await getRedisClient();
    const redisStatus = await redis.ping();
    const dbResult = await pool.query("SELECT 1 AS ok");
    const dbStatus =
      Array.isArray(dbResult.rows) && dbResult.rows[0]?.ok === 1
        ? "ok"
        : "unexpected";

    return NextResponse.json({
      data: {
        status: "ok",
        env: {
          database: !!process.env.DATABASE_URL,
          resend: !!process.env.RESEND_API_KEY,
          upstash: !!process.env.UPSTASH_REDIS_REST_URL,
          sentry: !!process.env.SENTRY_DSN,
        },
        services: {
          redis: redisStatus,
          database: dbStatus,
        },
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
