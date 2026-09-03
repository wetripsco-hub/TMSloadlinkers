"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-1.5">
      <Button type="button" onClick={handlePing} disabled={status === "sending"}>
        {status === "sending" ? "Sending location..." : "Share my location"}
      </Button>
      {status === "sent" && <span className="text-sm text-muted-foreground">Location sent.</span>}
      {status === "error" && error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
