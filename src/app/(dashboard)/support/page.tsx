import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge, type BadgeColor } from "@/components/ui/tailadmin/badge";
import { CreateTicketForm } from "@/components/support/create-ticket-form";
import { TicketThread, type TicketThreadMessage } from "@/components/support/ticket-thread";
import { RestartTourButton } from "@/components/onboarding/restart-tour-card";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Desk | FreightLink TMS",
};

const STATUS_BADGE_COLOR: Record<string, BadgeColor> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "light",
};

interface TicketWithMessages {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  support_ticket_messages: {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
  }[];
}

export default async function SupportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, description, priority, status, created_at, support_ticket_messages(id, sender_type, message, created_at)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Help & Support Desk"
          subtitle="Submit operational support tickets and consult knowledge base guides."
          breadcrumbs={[{ label: "Support", href: "/support" }]}
        />
        <ErrorState
          title="Failed to load support tickets"
          error={error.message}
        />
      </div>
    );
  }

  const tickets = (data ?? []) as unknown as TicketWithMessages[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support Desk"
        subtitle="Submit operational support tickets and consult knowledge base guides."
        breadcrumbs={[{ label: "Support", href: "/support" }]}
        action={<RestartTourButton />}
      />

      <CreateTicketForm />

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No support tickets open"
            description="Have a technical inquiry or dispatch issue? Submit a ticket using the form."
          />
        ) : (
          tickets.map((ticket) => {
            const messages: TicketThreadMessage[] = [...ticket.support_ticket_messages]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((m) => ({
                id: m.id,
                senderType: m.sender_type as TicketThreadMessage["senderType"],
                message: m.message,
                createdAt: m.created_at,
              }));

            return (
              <div key={ticket.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{ticket.subject}</h3>
                    <span className="text-xs text-slate-400">
                      • {formatDateTime(ticket.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="light" size="sm">
                      {ticket.priority}
                    </Badge>
                    <Badge color={STATUS_BADGE_COLOR[ticket.status] ?? "light"} size="sm">
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
                <p className="mb-3 text-sm text-slate-600">{ticket.description}</p>
                <TicketThread ticketId={ticket.id} messages={messages} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
