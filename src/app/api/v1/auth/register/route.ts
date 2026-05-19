import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/utils/hash";
import { registerSchema } from "@/lib/validations/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();
  const parseResult = registerSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { data: null, error: parseResult.error.flatten().formErrors.join(" ") },
      { status: 422 },
    );
  }

  const { email, password, fullName, phone, pdpaVersion } = parseResult.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (existing) {
    return NextResponse.json(
      { data: null, error: "Email đã được sử dụng." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: "buyer",
    full_name: fullName,
    phone,
    pdpa_consented_at: new Date(),
    pdpa_version: pdpaVersion,
  });

  return NextResponse.json(
    { data: { success: true }, error: null },
    { status: 201 },
  );
}
