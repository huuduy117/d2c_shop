import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME ?? "No Reply";

if (!RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables.");
}

if (!RESEND_FROM_EMAIL) {
  throw new Error("Missing RESEND_FROM_EMAIL in environment variables.");
}

export type ResendEmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

export async function sendResendEmail({
  to,
  subject,
  html,
  text,
  from,
}: ResendEmailPayload) {
  const payload = {
    from: from ?? `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `Resend API error ${response.status}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
