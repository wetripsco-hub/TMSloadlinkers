import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AccessState =
  | "ok"
  | "email_pending"
  | "email_unverified"
  | "trial_ending"
  | "past_due"
  | "locked";

const EMAIL_VERIFICATION_GRACE_DAYS = 7;

export interface AccessStatus {
  state: AccessState;
  canWrite: boolean;
  daysRemaining: number;
  message: string | null;
}

const OK_STATUS: AccessStatus = {
  state: "ok",
  canWrite: true,
  daysRemaining: 0,
  message: null,
};

export async function getAccessStatus(): Promise<AccessStatus> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return OK_STATUS;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, email_verified_at, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) return OK_STATUS;

  if (!profile.email_verified_at) {
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilRequired = Math.max(0, EMAIL_VERIFICATION_GRACE_DAYS - daysSinceSignup);

    if (daysSinceSignup >= EMAIL_VERIFICATION_GRACE_DAYS) {
      return {
        state: "email_unverified",
        canWrite: false,
        daysRemaining: 0,
        message: "Verify your email address to keep editing. Check your inbox for the verification link, or resend it below.",
      };
    }

    return {
      state: "email_pending",
      canWrite: true,
      daysRemaining: daysUntilRequired,
      message: `Please verify your email address within ${daysUntilRequired} day${daysUntilRequired === 1 ? "" : "s"}. Check your inbox for the verification link, or resend it below.`,
    };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("state, trial_ends_at, current_period_end")
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (!subscription) return OK_STATUS;

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  switch (subscription.state) {
    case "active":
      return { state: "ok", canWrite: true, daysRemaining: 0, message: null };

    case "trialing": {
      if (daysRemaining <= 3) {
        return {
          state: "trial_ending",
          canWrite: true,
          daysRemaining,
          message:
            daysRemaining === 0
              ? "Your trial ends today. Add a card to avoid losing access."
              : `Your trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Add a card to avoid losing access.`,
        };
      }
      return { state: "ok", canWrite: true, daysRemaining, message: null };
    }

    case "past_due":
      return {
        state: "past_due",
        canWrite: true,
        daysRemaining: 0,
        message: "Payment failed. Update your card to avoid losing access.",
      };

    case "expired":
    case "canceled":
      return {
        state: "locked",
        canWrite: false,
        daysRemaining: 0,
        message: "Your plan has ended. Your data is safe and readable — add a card to resume editing.",
      };

    default:
      return OK_STATUS;
  }
}
