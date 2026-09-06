import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { PageHeader } from "@/components/layout/page-header";
import { TicketQueue, type PlatformTicketRow } from "@/components/support/ticket-queue";
import type { TicketThreadMessage } from "@/components/support/ticket-thread";
import { ErrorState } from "@/components/ui/error-state";

export const dynamic = "force-dynamic";

interface TicketWithOrgAndMessages {
  id: string;
  org_id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  organizations: { name: string } | null;
  support_ticket_messages: {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
  }[];
}

export default async function PlatformAdminTicketsPage() {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      "id, org_id, subject, description, priority, status, assigned_to, created_at, organizations(name), support_ticket_messages(id, sender_type, message, created_at)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Support Tickets"
          subtitle="Triage and resolve customer tickets across all platform tenants."
          breadcrumbs={[
            { label: "Platform Admin", href: "/platform-admin" },
            { label: "Support Tickets", href: "/platform-admin/tickets" },
          ]}
        />
        <ErrorState
          title="Failed to load support tickets"
          description={error.message}
        />
      </div>
    );
  }

  const rows: PlatformTicketRow[] = ((data ?? []) as unknown as TicketWithOrgAndMessages[]).map(
    (ticket) => {
      const messages: TicketThreadMessage[] = [...ticket.support_ticket_messages]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m) => ({
          id: m.id,
          senderType: m.sender_type as TicketThreadMessage["senderType"],
          message: m.message,
          createdAt: m.created_at,
        }));

      return {
        id: ticket.id,
        orgId: ticket.org_id,
        orgName: ticket.organizations?.name ?? "Unknown organization",
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        assignedTo: ticket.assigned_to,
        createdAt: ticket.created_at,
        messages,
      };
    }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        subtitle="Triage and resolve customer tickets across all platform tenants."
        breadcrumbs={[
          { label: "Platform Admin", href: "/platform-admin" },
          { label: "Support Tickets", href: "/platform-admin/tickets" },
        ]}
      />
      <TicketQueue tickets={rows} />
    </div>
  );
}
