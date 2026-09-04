import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AccessState = "ok" | "trial_ending" | "past_due" | "locked";

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
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) return OK_STATUS;

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
