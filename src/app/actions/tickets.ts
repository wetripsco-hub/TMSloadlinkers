"use server";

// Shared by two disjoint route trees -- (dashboard)/support (tenant) and
// (platform-admin)/platform-admin/tickets (admin) -- so this deliberately
// breaks from this repo's usual "actions.ts colocated with its one route"
// convention; there is no single owning route to colocate it under.

import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import type { UUID } from "../../../types/domain";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
type TicketPriority = (typeof PRIORITIES)[number];

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
type TicketStatus = (typeof STATUSES)[number];

async function requireTenantContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.org_id) {
    throw new Error("No organization found for the current user");
  }

  return { supabase, userId: user.id as UUID, orgId: profile.org_id as UUID };
}

async function isCallerPlatformAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_platform_admin", { uid: userId });
  return data === true;
}

export async function createTicket(input: {
  subject: string;
  description: string;
  priority: TicketPriority;
}) {
  const subject = input.subject.trim();
  const description = input.description.trim();

  if (!subject) throw new Error("Subject is required");
  if (!description) throw new Error("Description is required");
  if (!PRIORITIES.includes(input.priority)) throw new Error("Invalid priority");

  const { supabase, userId, orgId } = await requireTenantContext();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      org_id: orgId,
      created_by: userId,
      subject,
      description,
      priority: input.priority,
    })
    .select("id")
    .single();

  if (error) throw error;

  const supportInbox = process.env.SUPPORT_NOTIFICATION_EMAIL;
  if (supportInbox) {
    // Best-effort: a notification failing to send should never block ticket
    // creation itself -- the ticket already exists and is visible in the
    // admin queue regardless of whether this email goes out.
    try {
      await sendEmail({
        to: supportInbox,
        subject: `[New ticket] ${subject}`,
        react: createElement(
          "div",
          null,
          createElement("p", null, `New support ticket from ${org?.name ?? "a tenant"}.`),
          createElement("p", null, `Priority: ${input.priority}`),
          createElement("p", null, description)
        ),
      });
    } catch (emailError) {
      console.error("Failed to send new-ticket notification email:", emailError);
    }
  }

  revalidatePath("/support");
  revalidatePath("/platform-admin/tickets");

  return ticket;
}

export async function replyToTicket(ticketId: UUID, message: string) {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Message is required");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const isPlatformAdmin = await isCallerPlatformAdmin(supabase, user.id);
  const senderType = isPlatformAdmin ? "platform_admin" : "tenant";

  const { error: insertError } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    sender_type: senderType,
    message: trimmed,
  });

  if (insertError) throw insertError;

  if (isPlatformAdmin) {
    // Notify the tenant that a platform admin replied. Best-effort: never
    // let a notification failure roll back or mask a reply that already
    // landed.
    try {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("subject, org_id")
        .eq("id", ticketId)
        .maybeSingle();

      if (ticket) {
        const { data: org } = await supabase
          .from("organizations")
          .select("contact_email")
          .eq("id", ticket.org_id)
          .maybeSingle();

        if (org?.contact_email) {
          await sendEmail({
            to: org.contact_email,
            subject: `[Ticket update] ${ticket.subject}`,
            react: createElement(
              "div",
              null,
              createElement("p", null, "Loadlinkers support replied to your ticket:"),
              createElement("p", null, trimmed)
            ),
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send ticket-reply notification email:", emailError);
    }
  }

  revalidatePath("/support");
  revalidatePath("/platform-admin/tickets");
}

export async function assignTicketToMe(ticketId: UUID) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const isPlatformAdmin = await isCallerPlatformAdmin(supabase, user.id);
  if (!isPlatformAdmin) throw new Error("Only platform admins may assign tickets");

  const { error } = await supabase
    .from("support_tickets")
    .update({ assigned_to: user.id, status: "in_progress" })
    .eq("id", ticketId);

  if (error) throw error;

  revalidatePath("/platform-admin/tickets");
}

export async function updateTicketStatus(ticketId: UUID, status: TicketStatus) {
  if (!STATUSES.includes(status)) throw new Error("Invalid status");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const isPlatformAdmin = await isCallerPlatformAdmin(supabase, user.id);
  if (!isPlatformAdmin) throw new Error("Only platform admins may change ticket status");

  const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);

  if (error) throw error;

  revalidatePath("/platform-admin/tickets");
  revalidatePath("/support");
}
