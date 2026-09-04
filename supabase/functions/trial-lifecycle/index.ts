// supabase/functions/trial-lifecycle/index.ts
// Phase 7 / Task P7-T8
//
// Cron-invoked (see supabase/config.toml schedule once wired up). Reads
// trial_lifecycle_targets() (017), sends the reminder/expiry email that
// matches how many days remain, and records the send in notifications_sent
// (016) so a retried or overlapping run never double-sends. When a
// trialing org crosses expiry, this is also what flips its subscription
// state to 'expired' -- org_can_write() reacts to that on the next check.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "Turvo <onboarding@resend.dev>";

type LifecycleTarget = {
  org_id: string;
  trial_ends_at: string;
  state: string;
  org_name: string;
  owner_email: string;
};

type Template = "trial_day_7" | "trial_day_11" | "trial_final_day" | "trial_expired";

const SUBJECTS: Record<Template, string> = {
  trial_day_7: "1 week left in your trial",
  trial_day_11: "3 days left in your trial",
  trial_final_day: "Your trial ends today",
  trial_expired: "Your trial has ended",
};

function bodyFor(template: Template, orgName: string): string {
  switch (template) {
    case "trial_day_7":
      return `Hi there,\n\n${orgName}'s trial has 7 days left. Add a card any time before it ends to keep your workspace active without interruption.`;
    case "trial_day_11":
      return `Hi there,\n\n${orgName}'s trial ends in 3 days. Add a card now to avoid losing access.`;
    case "trial_final_day":
      return `Hi there,\n\n${orgName}'s trial ends today. Add a card to keep editing without interruption.`;
    case "trial_expired":
      return `Hi there,\n\n${orgName}'s trial has ended. Your data is safe and readable -- add a card any time to resume editing.`;
  }
}

function templateFor(daysRemaining: number): Template | null {
  if (daysRemaining === 7) return "trial_day_7";
  if (daysRemaining === 3) return "trial_day_11";
  if (daysRemaining === 0) return "trial_final_day";
  if (daysRemaining < 0) return "trial_expired";
  return null;
}

async function sendEmail(to: string, template: Template, orgName: string) {
  const subject = SUBJECTS[template];
  const text = bodyFor(template, orgName);

  if (!RESEND_API_KEY) {
    console.log(`[dry-run] would send "${template}" to ${to}: ${subject}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${detail}`);
  }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: targets, error: targetsError } = await supabase.rpc(
    "trial_lifecycle_targets"
  );

  if (targetsError) {
    return new Response(JSON.stringify({ error: targetsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: Array<{ org_id: string; template: string; status: string }> = [];

  for (const target of (targets ?? []) as LifecycleTarget[]) {
    const daysRemaining = Math.ceil(
      (new Date(target.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const template = templateFor(daysRemaining);
    if (!template) continue;

    if (!target.owner_email) {
      results.push({ org_id: target.org_id, template, status: "skipped_no_owner_email" });
      continue;
    }

    const { error: insertError } = await supabase.from("notifications_sent").insert({
      org_id: target.org_id,
      template,
      recipient: target.owner_email,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        results.push({ org_id: target.org_id, template, status: "already_sent" });
        continue;
      }
      results.push({ org_id: target.org_id, template, status: `ledger_error: ${insertError.message}` });
      continue;
    }

    try {
      await sendEmail(target.owner_email, template, target.org_name);
    } catch (error) {
      results.push({
        org_id: target.org_id,
        template,
        status: `send_error: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }

    if (template === "trial_expired" && target.state === "trialing") {
      const { error: expireError } = await supabase
        .from("subscriptions")
        .update({ state: "expired" })
        .eq("org_id", target.org_id)
        .eq("state", "trialing");

      if (expireError) {
        results.push({
          org_id: target.org_id,
          template,
          status: `sent_but_expire_failed: ${expireError.message}`,
        });
        continue;
      }
    }

    results.push({ org_id: target.org_id, template, status: "sent" });
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
