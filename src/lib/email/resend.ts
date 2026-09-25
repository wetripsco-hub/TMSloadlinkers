import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set — emails will not be sent");
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export const EMAIL_FROM = "Loadlinkers <onboard@loadlinkers.co>";
export const EMAIL_REPLY_TO = "support@loadlinkers.co";
export const ADMIN_ALERT_EMAIL = "support@loadlinkers.co";
