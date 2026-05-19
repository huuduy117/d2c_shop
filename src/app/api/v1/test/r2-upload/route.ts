import { NextResponse } from "next/server";
import { uploadBufferToR2 } from "@/lib/storage/r2";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, text, contentType } = body;
    if (!key || !text)
      return NextResponse.json(
        { data: null, error: "Missing key or text" },
        { status: 400 },
      );

    const buffer = Buffer.from(text, "utf8");
    const url = await uploadBufferToR2(
      key,
      buffer,
      contentType ?? "text/plain; charset=utf-8",
    );
    return NextResponse.json({ data: { url }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
