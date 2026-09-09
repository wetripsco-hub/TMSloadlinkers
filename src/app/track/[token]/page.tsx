import { MapPin } from "lucide-react";
import { getLoadByTrackingToken } from "@/lib/repositories/tracking";
import { DriverCheckin } from "@/components/tracking/driver-checkin";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TrackLoadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const load = await getLoadByTrackingToken(token);

  if (!load) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <EmptyState
          icon={MapPin}
          title="Shipment Not Found"
          description="This tracking link is invalid, has expired, or the shipment has been completed. Please contact your dispatch coordinator."
        />
      </div>
    );
  }

  return <DriverCheckin token={token} load={load} />;
}
