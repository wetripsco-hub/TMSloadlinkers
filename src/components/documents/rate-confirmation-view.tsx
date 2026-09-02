import { formatCents } from "@/lib/money";
import type { Carrier, Load, LoadStop, Organization } from "../../../types/domain";

function formatStopWindow(stop: LoadStop): string {
  if (!stop.windowStart) return "TBD";
  const start = new Date(stop.windowStart).toLocaleString();
  if (!stop.windowEnd) return start;
  return `${start} - ${new Date(stop.windowEnd).toLocaleString()}`;
}

function StopBlock({ title, stop }: { title: string; stop: LoadStop }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <span className="text-sm font-medium">{stop.facilityName ?? "—"}</span>
      <span className="text-sm">{stop.address ?? "—"}</span>
      <span className="text-sm">
        {[stop.city, stop.state, stop.zip].filter(Boolean).join(", ") || "—"}
      </span>
      <span className="text-sm">{formatStopWindow(stop)}</span>
    </div>
  );
}

export function RateConfirmationView({
  load,
  carrier,
  organization,
}: {
  load: Load;
  carrier: Carrier | null;
  organization: Organization | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 bg-background p-8 text-foreground print:max-w-none print:gap-4 print:p-0">
      <header className="flex items-start justify-between border-b pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold">Rate Confirmation</h1>
          <span className="text-sm text-muted-foreground">{organization?.name ?? "—"}</span>
          <span className="text-xs text-muted-foreground">
            MC {organization?.mcNumber ?? "—"} / DOT {organization?.dotNumber ?? "—"}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <span className="font-medium">Load {load.loadNumber || load.id.slice(0, 8)}</span>
          <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <StopBlock title="Pickup" stop={load.origin} />
        <StopBlock title="Delivery" stop={load.destination} />
      </section>

      <section className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Equipment / Commodity
          </span>
          <span className="text-sm">Equipment: {load.equipmentType || "—"}</span>
          <span className="text-sm">Commodity: {load.commodity ?? "—"}</span>
          <span className="text-sm">
            Weight: {load.weightLbs !== null ? `${load.weightLbs.toLocaleString()} lbs` : "—"}
          </span>
          {load.temperatureSetting && (
            <span className="text-sm">Temperature: {load.temperatureSetting}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Carrier
          </span>
          {carrier ? (
            <>
              <span className="text-sm font-medium">{carrier.companyName}</span>
              <span className="text-sm">
                MC {carrier.mcNumber || "—"} / DOT {carrier.dotNumber || "—"}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No carrier assigned</span>
          )}
        </div>
      </section>

      {load.specialInstructions && (
        <section className="border-t pt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Special instructions
          </span>
          <p className="text-sm">{load.specialInstructions}</p>
        </section>
      )}

      <section className="flex items-center justify-between border-t pt-4">
        <span className="text-sm font-semibold uppercase tracking-wide">Agreed carrier pay</span>
        <span className="text-xl font-semibold">{formatCents(load.carrierPay)}</span>
      </section>

      <section className="mt-8 grid gap-8 border-t pt-8 sm:grid-cols-2">
        <div className="flex flex-col gap-8">
          <div className="border-b border-dashed" style={{ height: "2.5rem" }} />
          <span className="text-xs text-muted-foreground">Carrier signature / date</span>
        </div>
        <div className="flex flex-col gap-8">
          <div className="border-b border-dashed" style={{ height: "2.5rem" }} />
          <span className="text-xs text-muted-foreground">Broker signature / date</span>
        </div>
      </section>
    </div>
  );
}
