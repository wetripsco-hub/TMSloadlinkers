import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npx tsx scripts/test-send-otp-email.ts <recipient-email>");
    process.exit(1);
  }

  const { sendEmail } = await import("../src/lib/email/client");
  const { OtpCodeEmail } = await import("../src/lib/email/templates/otp-code");

  const result = await sendEmail({
    to,
    subject: "Your verification code",
    react: OtpCodeEmail({ code: "123456" }),
  });

  console.log("Sent:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
