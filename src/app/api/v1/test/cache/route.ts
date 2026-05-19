import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return NextResponse.json(
      { data: null, error: "Missing key" },
      { status: 400 },
    );
  }

  const value = await cacheGet(key);
  return NextResponse.json({ data: { key, value }, error: null });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { key, value, ttlSeconds } = body;
  if (!key || typeof value === "undefined") {
    return NextResponse.json(
      { data: null, error: "Missing key or value" },
      { status: 400 },
    );
  }

  await cacheSet(key, value, typeof ttlSeconds === "number" ? ttlSeconds : 60);
  return NextResponse.json({
    data: { key, ttlSeconds: ttlSeconds ?? 60 },
    error: null,
  });
}
