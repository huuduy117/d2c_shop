import { NextResponse } from "next/server";
import { sendResendEmail } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, subject, html, text } = body;

    if (!email || !subject || !html) {
      return NextResponse.json(
        { data: null, error: "Missing email, subject, or html body." },
        { status: 400 },
      );
    }

    const result = await sendResendEmail({
      to: email,
      subject,
      html,
      text,
    });

    return NextResponse.json(
      { data: { message: "Email sent", result }, error: null },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
