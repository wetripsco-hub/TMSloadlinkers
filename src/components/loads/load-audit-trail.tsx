import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditEvent } from "@/lib/repositories/audit";

const ACTION_LABELS: Record<AuditEvent["action"], string> = {
  insert: "Created",
  update: "Updated",
  delete: "Deleted",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function LoadAuditTrail({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{ACTION_LABELS[event.action]}</span>
              <span className="text-muted-foreground">{formatTimestamp(event.createdAt)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
