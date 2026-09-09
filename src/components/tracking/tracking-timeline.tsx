import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDate } from "@/lib/format";
import { computeStopLateness, formatLatenessDuration } from "@/lib/tracking/timeline-helpers";

export interface TrackingTimelineStop {
  label: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  windowEnd: string | null;
  arrivedAt: string | null;
  isCompleted: boolean;
  lat: number | null;
  lng: number | null;
}

function StopMapThumbnail({ lat, lng }: { lat: number | null; lng: number | null }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
      <MapPin className="h-5 w-5 text-slate-400" aria-hidden />
      <span className="sr-only">
        {lat !== null && lng !== null
          ? `Map location ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          : "Map location unavailable"}
      </span>
    </div>
  );
}

function TimelineRow({ stop, isLast }: { stop: TrackingTimelineStop; isLast: boolean }) {
  const lateness = computeStopLateness(stop.windowEnd, stop.arrivedAt);
  const facilityLine = [stop.city, stop.state].filter(Boolean).join(", ");

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && (
        <div
          className="absolute top-4 left-[7px] h-full w-0.5 bg-blue-200"
          aria-hidden
        />
      )}
      <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
        <span
          className={cn(
            "block h-3.5 w-3.5 rounded-full border-2",
            stop.isCompleted
              ? "border-blue-600 bg-blue-600"
              : "border-slate-300 bg-white"
          )}
        />
      </div>

      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <StopMapThumbnail lat={stop.lat} lng={stop.lng} />
          <div className="flex flex-col gap-0.5 pt-0.5">
            <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
              {stop.label}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {stop.facilityName ?? "Facility not on file"}
            </span>
            {facilityLine && <span className="text-sm text-slate-500">{facilityLine}</span>}
            {lateness?.isLate && (
              <span className="mt-1 inline-flex w-fit items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                {formatLatenessDuration(lateness.durationMs)}
              </span>
            )}
          </div>
        </div>

        <div className="pt-0.5 text-right text-xs whitespace-nowrap text-slate-500">
          {stop.arrivedAt ? (
            <span className="font-medium text-slate-700">{formatDateTime(stop.arrivedAt)}</span>
          ) : stop.windowEnd ? (
            <span>Due {formatDate(stop.windowEnd)}</span>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrackingTimeline({ stops }: { stops: TrackingTimelineStop[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {stops.map((stop, index) => (
        <TimelineRow key={stop.label} stop={stop} isLast={index === stops.length - 1} />
      ))}
    </div>
  );
}
