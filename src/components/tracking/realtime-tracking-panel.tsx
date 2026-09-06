"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { GpsPing } from "@/lib/repositories/tracking";

interface RealtimeTrackingPanelProps {
  loadId: string;
  trackingToken: string;
  driverName: string | null;
  driverPhone: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastPingAt: string | null;
  initialPings: GpsPing[];
}

interface LoadTrackingRow {
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_ping_at: string | null;
}

interface GpsPingRow {
  id: string;
  lat: number;
  lng: number;
  recorded_at: string;
}

export function RealtimeTrackingPanel({
  loadId,
  trackingToken,
  driverName,
  driverPhone,
  truckNumber,
  trailerNumber,
  lastKnownLat,
  lastKnownLng,
  lastPingAt,
  initialPings,
}: RealtimeTrackingPanelProps) {
  const [position, setPosition] = useState({ lat: lastKnownLat, lng: lastKnownLng, at: lastPingAt });
  const [pings, setPings] = useState<GpsPing[]>(initialPings);
  const [copied, setCopied] = useState(false);
  const trackingPath = `/track/${trackingToken}`;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`load-tracking-${loadId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "loads", filter: `id=eq.${loadId}` },
        (payload) => {
          const row = payload.new as LoadTrackingRow;
          setPosition({ lat: row.last_known_lat, lng: row.last_known_lng, at: row.last_ping_at });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gps_pings", filter: `load_id=eq.${loadId}` },
        (payload) => {
          const row = payload.new as GpsPingRow;
          setPings((prev) => [
            { id: row.id, lat: row.lat, lng: row.lng, recordedAt: row.recorded_at },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadId]);

  async function handleCopyLink() {
    const url = `${window.location.origin}${trackingPath}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Live Driver Telemetry</h3>
        <div className="flex flex-col gap-3 text-sm divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium">Driver</span>
            <span className="text-right font-semibold text-slate-900">{driverName ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium">Driver Phone</span>
            <span className="text-right font-mono text-slate-700">{driverPhone ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium">Truck Number</span>
            <span className="text-right font-mono text-slate-700">{truckNumber ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium">Trailer Number</span>
            <span className="text-right font-mono text-slate-700">{trailerNumber ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium">Last Known GPS</span>
            <span className="text-right font-mono text-slate-800 tabular-nums">
              {position.lat !== null && position.lng !== null
                ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium">Last Telemetry Ping</span>
            <span className="text-right text-slate-700">
              {position.at ? new Date(position.at).toLocaleString() : "—"}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 pt-3">
            <span className="truncate text-xs font-mono text-slate-600">{trackingPath}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? "Copied" : "Copy link"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-slate-900">GPS Ping History</h3>
        <div>
          {pings.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No GPS pings recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm divide-y divide-slate-100">
              {pings.map((ping) => (
                <li key={ping.id} className="flex items-center justify-between pt-2">
                  <span className="font-mono text-slate-800 tabular-nums text-xs">
                    {ping.lat.toFixed(4)}, {ping.lng.toFixed(4)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(ping.recordedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
