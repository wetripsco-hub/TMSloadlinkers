"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Live tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Driver</span>
            <span className="text-right font-medium">{driverName ?? "—"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Driver phone</span>
            <span className="text-right font-medium">{driverPhone ?? "—"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Truck</span>
            <span className="text-right font-medium">{truckNumber ?? "—"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Trailer</span>
            <span className="text-right font-medium">{trailerNumber ?? "—"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Last known position</span>
            <span className="text-right font-medium tabular-nums">
              {position.lat !== null && position.lng !== null
                ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                : "—"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Last update</span>
            <span className="text-right font-medium">
              {position.at ? new Date(position.at).toLocaleString() : "—"}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">{trackingPath}</span>
            <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ping history</CardTitle>
        </CardHeader>
        <CardContent>
          {pings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No GPS pings recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {pings.map((ping) => (
                <li key={ping.id} className="flex items-center justify-between gap-4">
                  <span className="tabular-nums">
                    {ping.lat.toFixed(4)}, {ping.lng.toFixed(4)}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(ping.recordedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
