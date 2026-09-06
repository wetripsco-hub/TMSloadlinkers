"use client";

import { useState } from "react";
import { Navigation, Loader2 } from "lucide-react";
import { submitTrackingPingAction } from "@/app/track/[token]/actions";

type PingStatus = "idle" | "sending" | "sent" | "error";

export function DriverPingButton({ token }: { token: string }) {
  const [status, setStatus] = useState<PingStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  function handlePing() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Geolocation is not supported on this device");
      return;
    }

    setStatus("sending");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        submitTrackingPingAction(token, position.coords.latitude, position.coords.longitude)
          .then(() => setStatus("sent"))
          .catch((err: unknown) => {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Failed to send location");
          });
      },
      (geoError) => {
        setStatus("error");
        setError(geoError.message || "Failed to get current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePing}
        disabled={status === "sending"}
        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sharing live location...</span>
          </>
        ) : (
          <>
            <Navigation className="h-5 w-5" />
            <span>Share my location</span>
          </>
        )}
      </button>
      {status === "sent" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700">
          Location received! Dispatch telemetry updated.
        </p>
      )}
      {status === "error" && error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
