import dotenv from "dotenv";
import { sendResendEmail } from "@/lib/email/resend";

dotenv.config({ path: ".env.local" });

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";

  try {
    const result = await sendResendEmail({
      to: email,
      subject: "D2C Phase 0 Resend Email Test",
      html: `<p>Hello from D2C Phase 0 test. If you received this, Resend is configured correctly.</p>`,
      text: "Hello from D2C Phase 0 test. If you received this, Resend is configured correctly.",
    });

    console.log("Email sent successfully:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Failed to send email:", error);
    process.exit(1);
  }
}

main();
