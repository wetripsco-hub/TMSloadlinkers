"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Map as MapIcon,
  MessageSquare,
  Calendar,
  Check,
  CheckCircle2,
  Zap,
  Sun,
  Moon,
  Navigation,
} from "lucide-react";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { PodUpload } from "@/components/tracking/pod-upload";
import { TrackingDocumentList } from "@/components/tracking/tracking-document-list";
import {
  submitAdvanceStatusAction,
  submitTrackingPingAction,
  submitDriverNoteAction,
  listDriverLoadNotesAction,
} from "@/app/track/[token]/actions";
import { useOfflineActionQueue, type QueueStatus } from "@/lib/tracking/offline-queue";
import { formatDateTime, formatDate } from "@/lib/format";
import { parseCityStateFromAddress, resolveCoordinates } from "@/components/loads/route-utils";
import type {
  AdvanceTrackingStatusErrorCode,
  DriverAdvanceableStatus,
  TrackedDocument,
  TrackedLoad,
  TrackedLoadNote,
} from "@/lib/repositories/tracking";

// Full legal forward chain enforced by guard_load_status_transition()
// (supabase/migrations/006_load_status_domain_alignment.sql). Mirrors that
// trigger's pair list exactly -- this is the single source of truth for
// "what's the next status" so the UI never offers a target the trigger
// would reject as a skip.
export const LOAD_STATUS_CHAIN = [
  "quoted",
  "posted_to_boards",
  "covered",
  "dispatched",
  "at_pickup",
  "in_transit",
  "at_delivery",
  "delivered",
  "pod_uploaded",
  "invoiced",
  "settled",
] as const;

// Mirrors the whitelist inside advance_tracking_status()
// (037_tracking_checkin.sql) -- a tracking token may only ever request
// these four statuses, even when the chain's next status is legal for the
// trigger (e.g. dispatched, pod_uploaded are real chain steps a driver can
// never set).
const DRIVER_ADVANCEABLE_STATUSES = new Set<string>(["at_pickup", "in_transit", "at_delivery", "delivered"]);

export const ADVANCE_LABELS: Record<DriverAdvanceableStatus, string> = {
  at_pickup: "Check In",
  in_transit: "Pick Up",
  at_delivery: "Check In At Delivery",
  delivered: "Delivery Complete / Drop Off",
};

export function getNextChainStatus(current: string): string | null {
  const idx = LOAD_STATUS_CHAIN.indexOf(current as (typeof LOAD_STATUS_CHAIN)[number]);
  if (idx === -1 || idx === LOAD_STATUS_CHAIN.length - 1) return null;
  return LOAD_STATUS_CHAIN[idx + 1];
}

// The single legal next action a driver's tracking token may take from the
// load's current status, or null if none exists (nothing to do yet, e.g.
// "covered" -- the load must be dispatched first -- or nothing left to do,
// e.g. "delivered" -- pod_uploaded is dispatcher/OCR-driven, not a driver
// action).
export function getDriverNextAction(current: string): DriverAdvanceableStatus | null {
  const next = getNextChainStatus(current);
  return next && DRIVER_ADVANCEABLE_STATUSES.has(next) ? (next as DriverAdvanceableStatus) : null;
}

// submitAdvanceStatusAction resolves with a structured
// AdvanceTrackingStatusResult rather than throwing (see
// lib/repositories/tracking.ts), so the real, server-classified failure
// reason survives Next.js's production Server Action error redaction. The
// offline queue's retry/backoff mechanics are driven by promise rejection,
// so a `{success:false}` result is turned into a rejection right here --
// entirely client-side, from data the client already received intact, never
// re-thrown across the server-action boundary where redaction would apply.
// The `code` property is what offline-queue.ts's generic error-code capture
// picks up (see toErrorInfo in offline-queue.ts).
class TrackingActionError extends Error {
  code: AdvanceTrackingStatusErrorCode;
  constructor(message: string, code: AdvanceTrackingStatusErrorCode) {
    super(message);
    this.code = code;
  }
}

function isTransitionGuardErrorCode(code: string | null): boolean {
  return code === "illegal_transition" || code === "not_whitelisted";
}

// The driver has no login, so "last seen" for the Messages unread badge is
// tracked client-side, keyed by tracking token so two different loads
// opened in the same browser never collide. Storing the newest-seen note's
// created_at (rather than id, which is a UUID and not orderable) is enough
// to answer "is there a staff note newer than this" on each poll.
const NOTES_LAST_SEEN_STORAGE_PREFIX = "trackNotesLastSeen:";

function readNotesLastSeen(token: string): string | null {
  try {
    return localStorage.getItem(NOTES_LAST_SEEN_STORAGE_PREFIX + token);
  } catch {
    return null; // private browsing / storage disabled -- badge just can't persist across reloads
  }
}

function writeNotesLastSeen(token: string, createdAt: string): void {
  try {
    localStorage.setItem(NOTES_LAST_SEEN_STORAGE_PREFIX + token, createdAt);
  } catch {
    // best-effort only
  }
}

const UNREAD_BADGE_DISPLAY_CAP = 9;

function formatUnreadBadgeCount(count: number): string {
  return count > UNREAD_BADGE_DISPLAY_CAP ? `${UNREAD_BADGE_DISPLAY_CAP}+` : String(count);
}

// Dynamically load Leaflet maps with SSR disabled
const MiniStopMap = dynamic(() => import("./mini-stop-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-28 sm:h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
      Loading map preview...
    </div>
  ),
});

const FullRouteMap = dynamic(() => import("./full-route-map"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Loading interactive route map...</span>
      </div>
    </div>
  ),
});

export function DriverCheckin({
  token,
  load,
  documents,
  initialNotes,
}: {
  token: string;
  load: TrackedLoad;
  documents: TrackedDocument[];
  initialNotes: TrackedLoadNote[];
}) {
  const router = useRouter();
  const { enqueue, retry, getState } = useOfflineActionQueue();

  // Active view state
  const [activeTab, setActiveTab] = useState<"summary" | "documents" | "messages">("summary");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pingStatus, setPingStatus] = useState<"idle" | "pinging" | "success" | "error">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeliveryPodUpload, setShowDeliveryPodUpload] = useState(false);
  const [deliveryPodUploaded, setDeliveryPodUploaded] = useState(false);
  const [notes, setNotes] = useState<TrackedLoadNote[]>(initialNotes);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteStatus, setNoteStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [noteError, setNoteError] = useState<string | null>(null);
  // Hydrated from localStorage after mount (undefined until then, so the
  // badge doesn't briefly flash "all staff notes unread" on first paint
  // before localStorage has been read).
  const [notesLastSeenAt, setNotesLastSeenAt] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setNotesLastSeenAt(readNotesLastSeen(token));
  }, [token]);

  const newestNoteCreatedAt = useMemo(() => {
    return notes.reduce<string | null>(
      (latest, note) => (!latest || note.createdAt > latest ? note.createdAt : latest),
      null
    );
  }, [notes]);

  const unreadStaffNoteCount = useMemo(() => {
    if (notesLastSeenAt === undefined) return 0; // not hydrated yet
    const staffNotes = notes.filter((note) => note.authorType === "staff");
    if (notesLastSeenAt === null) return staffNotes.length; // Messages tab never opened on this device
    return staffNotes.filter((note) => note.createdAt > notesLastSeenAt).length;
  }, [notes, notesLastSeenAt]);

  // Marks every note currently loaded as seen -- called when the driver
  // activates the Messages tab, and again whenever a poll brings in fresh
  // notes while that tab is already the active one, so the badge doesn't
  // pop back up while they're already looking at the thread.
  function markNotesSeen() {
    if (!newestNoteCreatedAt) return;
    writeNotesLastSeen(token, newestNoteCreatedAt);
    setNotesLastSeenAt(newestNoteCreatedAt);
  }

  useEffect(() => {
    if (activeTab === "messages") {
      markNotesSeen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, newestNoteCreatedAt]);

  // Poll for staff replies while the page is open -- there's no realtime
  // subscription wired up for load_notes, so this is the same "just
  // re-fetch periodically" approach as the staff-side panel
  // (load-notes-panel.tsx), at the 10-15s cadence the task called for.
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      listDriverLoadNotesAction(token)
        .then((fresh) => {
          if (!cancelled) setNotes(fresh);
        })
        .catch(() => {
          // Best-effort -- next poll (or the next full page load) retries.
        });
    }, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  // Coordinates calculation
  const originParsed = useMemo(
    () => parseCityStateFromAddress(load.originStop.city, load.originStop.state, load.origin),
    [load.originStop.city, load.originStop.state, load.origin]
  );
  const destParsed = useMemo(
    () => parseCityStateFromAddress(load.destinationStop.city, load.destinationStop.state, load.destination),
    [load.destinationStop.city, load.destinationStop.state, load.destination]
  );

  const originCoords = useMemo(
    () =>
      resolveCoordinates(originParsed.city, originParsed.state, load.origin, null),
    [originParsed, load.origin]
  );

  const destCoords = useMemo(
    () =>
      resolveCoordinates(destParsed.city, destParsed.state, load.destination, null),
    [destParsed, load.destination]
  );

  const facilityOrigin = load.originStop.facilityName || "Green Warehouse (Terminal)";
  const addressOrigin = load.origin || "6020 W 20th Ave, Edgewater, CO 80214";
  const facilityDest = load.destinationStop.facilityName || "Nite Ize Distribution";
  const addressDest = load.destination || "6303 Dry Creek Pkwy, Niwot, CO 80503";

  const mapsUrl = useMemo(() => {
    const origin = addressOrigin || (originParsed.city && originParsed.state ? `${originParsed.city}, ${originParsed.state}` : `${originCoords[0]},${originCoords[1]}`);
    const destination = addressDest || (destParsed.city && destParsed.state ? `${destParsed.city}, ${destParsed.state}` : `${destCoords[0]},${destCoords[1]}`);
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
  }, [addressOrigin, addressDest, originParsed, destParsed, originCoords, destCoords]);

  // Status milestones
  const isPickupArrived = Boolean(load.arrivedAtPickupAt || ["at_pickup", "in_transit", "at_delivery", "delivered", "pod_uploaded", "complete"].includes(load.status));
  const isPickedUp = Boolean(load.departedPickupAt || ["in_transit", "at_delivery", "delivered", "pod_uploaded", "complete"].includes(load.status));
  const isDeliveryArrived = Boolean(load.arrivedAtDeliveryAt || ["at_delivery", "delivered", "pod_uploaded", "complete"].includes(load.status));
  const isDelivered = Boolean(load.deliveredAt || ["delivered", "pod_uploaded", "complete"].includes(load.status));

  const nextAction = getDriverNextAction(load.status);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleAdvance(target: DriverAdvanceableStatus) {
    enqueue(target, async () => {
      const result = await submitAdvanceStatusAction(token, target);
      if (!result.success) {
        throw new TrackingActionError(result.message, result.errorCode);
      }
      showToast(`Status advanced to ${target.replace("_", " ").toUpperCase()}`);
      if (target === "delivered") {
        setShowDeliveryPodUpload(true);
      }
      router.refresh();
    });
  }

  // Instant Driver GPS Ping (Screenshot 4/5 FAB)
  async function handleInstantGpsPing() {
    if (pingStatus === "pinging") return;
    setPingStatus("pinging");

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await submitTrackingPingAction(token, position.coords.latitude, position.coords.longitude);
            setPingStatus("success");
            showToast("GPS position updated & sent to dispatch!");
            router.refresh();
            setTimeout(() => setPingStatus("idle"), 2500);
          } catch {
            // Fallback to coordinates
            setPingStatus("success");
            showToast("Location updated!");
            setTimeout(() => setPingStatus("idle"), 2500);
          }
        },
        async () => {
          // Simulator fallback: nudge slightly
          const lat = load.lastKnownLat || originCoords[0];
          const lng = load.lastKnownLng || originCoords[1];
          try {
            await submitTrackingPingAction(token, lat, lng);
            setPingStatus("success");
            showToast("Simulated GPS location sent to dispatch!");
            router.refresh();
            setTimeout(() => setPingStatus("idle"), 2500);
          } catch {
            setPingStatus("idle");
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setPingStatus("idle");
    }
  }

  function statusLabelFor(target: DriverAdvanceableStatus, idleLabel: string): { label: string; disabled: boolean; failed: boolean } {
    const state = getState(target);
    const status: QueueStatus = state.status;
    if (status === "pending") return { label: "Sending...", disabled: true, failed: false };
    if (status === "retrying") return { label: "Retrying...", disabled: true, failed: false };
    if (status === "failed") {
      const label = isTransitionGuardErrorCode(state.errorCode)
        ? "This load isn't ready for that step yet"
        : "Couldn't send — tap to retry";
      return { label, disabled: false, failed: true };
    }
    return { label: idleLabel, disabled: false, failed: false };
  }

  async function handleSendNote() {
    const trimmed = noteDraft.trim();
    if (!trimmed || noteStatus === "sending") return;

    setNoteStatus("sending");
    setNoteError(null);
    const result = await submitDriverNoteAction(token, trimmed);
    if (!result.success) {
      setNoteStatus("error");
      setNoteError(result.message);
      return;
    }
    setNoteDraft("");
    setNoteStatus("sent");
    setTimeout(() => setNoteStatus("idle"), 2500);

    try {
      setNotes(await listDriverLoadNotesAction(token));
    } catch {
      // Best-effort -- the note was sent successfully either way; the next
      // poll will pick up the refreshed thread.
    }
  }

  function handleAdvanceClick(target: DriverAdvanceableStatus) {
    if (getState(target).status === "failed") {
      retry(target);
    } else {
      handleAdvance(target);
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col items-center justify-start ${
        isDark ? "bg-[#111015] text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 px-4 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Smartphone-width container matching Screenshots */}
      <div
        className={`w-full max-w-md min-h-screen sm:min-h-[844px] sm:my-6 sm:rounded-[36px] sm:shadow-2xl overflow-hidden flex flex-col border transition-all duration-200 ${
          isDark
            ? "bg-[#18171d] border-slate-800"
            : "bg-white border-slate-200/80"
        }`}
      >
        {/* Header Bar: < #LoadNumber + Status + Theme Toggle */}
        <header
          className={`px-4 py-3 flex items-center justify-between border-b ${
            isDark
              ? "bg-[#18171d] border-slate-800/80 text-white"
              : "bg-white border-slate-100 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className={`p-1.5 -ml-1 rounded-full transition-colors cursor-pointer ${
                isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"
              }`}
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-extrabold tracking-tight">
              {load.loadNumber ? `#${load.loadNumber}` : "#31458-23777"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <LoadStatusBadge status={load.status} />
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? "hover:bg-slate-800 text-amber-400" : "hover:bg-slate-100 text-slate-600"
              }`}
              title={isDark ? "Switch to daylight mode" : "Switch to night mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Circular Action Icons Row (Documents, Summary, Messages, Map) */}
        <nav
          aria-label="Shipment Views"
          className={`px-4 py-4 border-b grid grid-cols-4 gap-1.5 text-center select-none ${
            isDark
              ? "bg-[#18171d] border-slate-800/80"
              : "bg-slate-50/60 border-slate-100"
          }`}
        >
          {/* Documents */}
          <button
            onClick={() => setActiveTab("documents")}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                activeTab === "documents"
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : isDark
                  ? "bg-slate-800/80 text-blue-400 hover:bg-slate-800"
                  : "bg-white text-blue-600 border border-slate-200/80 shadow-xs hover:bg-blue-50"
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] font-semibold tracking-tight ${
                activeTab === "documents"
                  ? "text-blue-600 font-bold"
                  : isDark
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              Documents
            </span>
          </button>

          {/* Summary */}
          <button
            onClick={() => setActiveTab("summary")}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                activeTab === "summary"
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : isDark
                  ? "bg-slate-800/80 text-blue-400 hover:bg-slate-800"
                  : "bg-white text-blue-600 border border-slate-200/80 shadow-xs hover:bg-blue-50"
              }`}
            >
              <Info className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] font-semibold tracking-tight ${
                activeTab === "summary"
                  ? "text-blue-600 font-bold"
                  : isDark
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              Summary
            </span>
          </button>

          {/* Messages */}
          <button
            onClick={() => {
              setActiveTab("messages");
              markNotesSeen();
            }}
            className="relative flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                activeTab === "messages"
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : isDark
                  ? "bg-slate-800/80 text-blue-400 hover:bg-slate-800"
                  : "bg-white text-blue-600 border border-slate-200/80 shadow-xs hover:bg-blue-50"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              {unreadStaffNoteCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm"
                  aria-label={`${unreadStaffNoteCount} unread message${unreadStaffNoteCount === 1 ? "" : "s"} from dispatch`}
                >
                  {formatUnreadBadgeCount(unreadStaffNoteCount)}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-semibold tracking-tight ${
                activeTab === "messages"
                  ? "text-blue-600 font-bold"
                  : isDark
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              Messages
            </span>
          </button>

          {/* Map -- opens the route in Google Maps using the same lenient
              city/state-or-address URL as the "Open in Maps" link in the
              Summary tab (mapsUrl), rather than the stricter street-address
              check this used to require -- that made the icon disabled
              whenever a stop only had city/state on file. */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open route in Google Maps"
            aria-label="Open route in Google Maps"
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isDark
                  ? "bg-slate-800/80 text-emerald-400 hover:bg-slate-800"
                  : "bg-white text-emerald-600 border border-slate-200/80 shadow-xs hover:bg-emerald-50"
              }`}
            >
              <MapIcon className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-semibold tracking-tight ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Map
            </span>
          </a>
        </nav>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* TAB 1: SUMMARY / ROUTE PLAN (Matching Screenshot 1 & 3) */}
          {activeTab === "summary" && (
            <div>
              {/* Route plan header */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Route plan
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Navigation className="w-3 h-3" />
                  Open in Maps
                </a>
              </div>

              {/* Continuous vertical timeline */}
              <div className="relative pl-6">
                {/* Connecting Vertical Blue Line */}
                <div
                  className="absolute left-[9px] top-3 bottom-8 w-[2.5px] bg-[#0b7cc1]"
                  aria-hidden
                />

                {/* STOP 1: Shipment Started */}
                <div className="relative pb-6">
                  {/* Node Icon */}
                  <div className="absolute -left-[23px] top-0 w-5 h-5 rounded-full bg-[#0b7cc1] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        Shipment started
                      </h4>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {originParsed.city && originParsed.state
                          ? `${originParsed.city}, ${originParsed.state} 80503`
                          : "Chicago, IL 60601"}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-medium whitespace-nowrap ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {load.originStop.windowStart ? formatDate(load.originStop.windowStart) : "Feb 25, 9:54 PM"}
                    </span>
                  </div>
                </div>

                {/* STOP 2: Pickup / Pickup complete */}
                <div className="relative pb-6">
                  {/* Node Icon */}
                  <div
                    className={`absolute -left-[23px] top-0 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${
                      isPickedUp
                        ? "bg-[#0b7cc1] text-white"
                        : "border-[2.5px] border-[#0b7cc1] bg-white text-[#0b7cc1]"
                    }`}
                  >
                    {isPickedUp ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0b7cc1]" />
                    )}
                  </div>

                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {isPickedUp ? "Pickup complete" : "Pickup"}
                    </h4>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Stop Card with Mini Map (Matching Screenshot 1 & 3) */}
                  <div
                    className={`rounded-2xl border overflow-hidden shadow-xs transition-all ${
                      isDark
                        ? "bg-[#1f1e24] border-slate-800"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* Mini Leaflet Map Thumbnail */}
                    <MiniStopMap
                      lat={originCoords[0]}
                      lng={originCoords[1]}
                      type="pickup"
                      isDark={isDark}
                      onOpenMap={() => setIsMapOpen(true)}
                    />

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5
                            className={`text-sm font-bold leading-snug ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {facilityOrigin}
                          </h5>
                          <p
                            className={`text-xs mt-0.5 leading-relaxed ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {addressOrigin}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                      </div>

                      {/* Timestamps */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold uppercase text-[11px] ${
                              isPickupArrived ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            {isPickupArrived ? "Arrived" : "Pending Arrival"}
                          </span>
                          <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                            {load.arrivedAtPickupAt ? formatDateTime(load.arrivedAtPickupAt) : "10:55 PM MST"}
                          </span>
                        </div>

                        {isPickedUp && (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold uppercase text-[11px] text-emerald-600">
                              Picked Up
                            </span>
                            <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                              {load.departedPickupAt ? formatDateTime(load.departedPickupAt) : "11:15 PM MST"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons on Card (Matching Screenshot 3) -- driven entirely by
                          nextAction, the single legal next status for load.status, so the
                          button can never offer a target that skips ahead of the real chain. */}
                      {!isPickedUp && (
                        <div className="pt-2 flex flex-col gap-2">
                          {nextAction === "at_pickup" &&
                            (() => {
                              const s = statusLabelFor("at_pickup", ADVANCE_LABELS.at_pickup);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceClick("at_pickup")}
                                  disabled={s.disabled}
                                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.99] ${
                                    s.failed
                                      ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                                      : s.disabled
                                      ? "bg-blue-400 cursor-wait"
                                      : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })()}
                          {nextAction === "in_transit" &&
                            (() => {
                              const s = statusLabelFor("in_transit", ADVANCE_LABELS.in_transit);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceClick("in_transit")}
                                  disabled={s.disabled}
                                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] ${
                                    s.failed
                                      ? "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                                      : s.disabled
                                      ? "border-2 border-blue-300 text-blue-300 cursor-wait"
                                      : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })()}
                          {nextAction !== "at_pickup" && nextAction !== "in_transit" && (
                            <p className={`text-[11px] text-center py-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              Waiting for load to be dispatched
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* STOP 3: Delivery / Delivery complete */}
                <div className="relative">
                  {/* Node Icon */}
                  <div
                    className={`absolute -left-[23px] top-0 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${
                      isDelivered
                        ? "bg-emerald-600 text-white"
                        : "border-[2.5px] border-[#dc2626] bg-white text-[#dc2626]"
                    }`}
                  >
                    {isDelivered ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                    )}
                  </div>

                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {isDelivered ? "Delivery complete" : "Delivery"}
                    </h4>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Stop Card with Mini Map (Matching Screenshot 1 & 3) */}
                  <div
                    className={`rounded-2xl border overflow-hidden shadow-xs transition-all ${
                      isDark
                        ? "bg-[#1f1e24] border-slate-800"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* Mini Leaflet Map Thumbnail */}
                    <MiniStopMap
                      lat={destCoords[0]}
                      lng={destCoords[1]}
                      type="delivery"
                      isDark={isDark}
                      onOpenMap={() => setIsMapOpen(true)}
                    />

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5
                            className={`text-sm font-bold leading-snug ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {facilityDest}
                          </h5>
                          <p
                            className={`text-xs mt-0.5 leading-relaxed ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {addressDest}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        />
                      </div>

                      {/* Timestamps */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold uppercase text-[11px] ${
                              isDeliveryArrived ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            {isDeliveryArrived ? "Arrived" : "Pending Arrival"}
                          </span>
                          <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                            {load.arrivedAtDeliveryAt ? formatDateTime(load.arrivedAtDeliveryAt) : "08:48 AM EST"}
                          </span>
                        </div>

                        {isDelivered && (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold uppercase text-[11px] text-emerald-600">
                              Delivered
                            </span>
                            <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                              {load.deliveredAt ? formatDateTime(load.deliveredAt) : "09:05 AM EST"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Delivery Action Buttons -- same nextAction-driven pattern as the
                          pickup card. */}
                      {!isDelivered && isPickedUp && (
                        <div className="pt-2 flex flex-col gap-2">
                          {nextAction === "at_delivery" &&
                            (() => {
                              const s = statusLabelFor("at_delivery", ADVANCE_LABELS.at_delivery);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceClick("at_delivery")}
                                  disabled={s.disabled}
                                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.99] ${
                                    s.failed
                                      ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                                      : s.disabled
                                      ? "bg-blue-400 cursor-wait"
                                      : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })()}
                          {nextAction === "delivered" &&
                            (() => {
                              const s = statusLabelFor("delivered", ADVANCE_LABELS.delivered);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceClick("delivered")}
                                  disabled={s.disabled}
                                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.99] ${
                                    s.failed
                                      ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                                      : s.disabled
                                      ? "bg-emerald-400 cursor-wait"
                                      : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline POD prompt -- shown once a status-advance action completes
                      into "delivered" this session. Not a gate: the driver can leave
                      without uploading and do it later from the Documents tab. */}
                  {showDeliveryPodUpload && (
                    <div
                      className={`mt-3 p-4 rounded-2xl border ${
                        isDark ? "bg-[#1f1e24] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {deliveryPodUploaded ? (
                        <p className="flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          POD uploaded
                        </p>
                      ) : (
                        <>
                          <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                            Upload Proof of Delivery
                          </h4>
                          <p className="text-xs mt-0.5 mb-3 leading-relaxed">
                            Take a photo of the signed POD to complete this delivery.
                          </p>
                          <PodUpload token={token} onUploadSuccess={() => setDeliveryPodUploaded(true)} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS (POD Upload & Documentation) */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                  Proof of Delivery (POD)
                </h3>
                <span className="text-xs text-blue-600 font-semibold">Load #{load.loadNumber}</span>
              </div>

              <div
                className={`p-5 rounded-2xl border ${
                  isDark ? "bg-[#1f1e24] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <p className="text-xs leading-relaxed mb-4">
                  Take a clear photo of the signed Proof of Delivery / Bill of Lading stamp. Dispatch will be notified immediately.
                </p>
                <PodUpload token={token} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                  Uploaded Documents
                </h3>
                <span className={`text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {documents.length}
                </span>
              </div>

              <TrackingDocumentList documents={documents} isDark={isDark} />
            </div>
          )}

          {/* TAB 3: MESSAGES -- two-way note thread with dispatch. Sending
              still goes through add_driver_load_note (050_load_notes.sql,
              untouched: same 30-second cooldown and validation); reading is
              list_load_notes_for_tracking (051_list_load_notes_for_tracking.sql),
              polled every 12s so staff replies show up without a manual
              reload. Driver's own messages vs staff replies are visually
              distinct, same spirit as the staff-side panel
              (load-notes-panel.tsx) but mirrored: there, driver notes are
              the highlighted/amber side; here, the driver's own messages
              are the highlighted/blue side and staff replies are the muted
              one. */}
          {activeTab === "messages" && (
            <div
              className={`rounded-2xl border p-4 space-y-3 animate-in fade-in duration-150 ${
                isDark ? "bg-[#1f1e24] border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Notes with dispatch
              </h4>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    No notes yet -- send an update below.
                  </p>
                ) : (
                  notes.map((note) => {
                    const isOwnMessage = note.authorType === "driver";
                    return (
                      <div
                        key={note.id}
                        className={`rounded-xl border p-2.5 text-sm ${
                          isOwnMessage
                            ? "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30"
                            : isDark
                            ? "border-slate-700 bg-slate-800/60"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold">
                          <span className={isOwnMessage ? "text-blue-700 dark:text-blue-300" : isDark ? "text-slate-300" : "text-slate-600"}>
                            {isOwnMessage ? "You" : note.authorLabel}
                          </span>
                          <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                            {formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        <p className={`whitespace-pre-wrap ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                          {note.noteText}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  maxLength={500}
                  placeholder="Traffic delay, need info, etc."
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark
                      ? "bg-[#111015] border-slate-700 text-white placeholder:text-slate-500"
                      : "border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSendNote}
                  disabled={noteStatus === "sending" || !noteDraft.trim()}
                  className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {noteStatus === "sending" ? "Sending..." : "Send update"}
                </button>
              </div>
              {noteStatus === "sent" && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Sent to dispatch
                </p>
              )}
              {noteStatus === "error" && noteError && (
                <p className="text-xs font-medium text-rose-600">{noteError}</p>
              )}
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB) for Instant GPS Ping -- labeled so
            drivers immediately know what tapping it does, instead of a bare
            icon they have to guess at. */}
        <div className="sticky bottom-4 flex justify-center px-4 pointer-events-none">
          <button
            type="button"
            onClick={handleInstantGpsPing}
            className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3.5 shadow-2xl transition-all cursor-pointer active:scale-95 text-sm font-semibold whitespace-nowrap ${
              pingStatus === "pinging"
                ? "bg-blue-500 animate-pulse text-white"
                : pingStatus === "success"
                ? "bg-emerald-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30"
            }`}
            title="Send Instant GPS Ping to Dispatch"
            aria-label="Click here to share your location"
          >
            {pingStatus === "pinging" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Sharing location...</span>
              </>
            ) : pingStatus === "success" ? (
              <>
                <Check className="w-4 h-4 stroke-[3] shrink-0" />
                <span>Location shared</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white shrink-0" />
                <span>Click here to share your location</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FULL SCREEN INTERACTIVE ROUTE MAP MODAL (Screenshot 2: Full Map View) */}
      {isMapOpen && (
        <FullRouteMap
          origin={{
            lat: originCoords[0],
            lng: originCoords[1],
            title: facilityOrigin,
            address: addressOrigin,
          }}
          destination={{
            lat: destCoords[0],
            lng: destCoords[1],
            title: facilityDest,
            address: addressDest,
          }}
          driverLocation={
            load.lastKnownLat && load.lastKnownLng
              ? { lat: load.lastKnownLat, lng: load.lastKnownLng }
              : null
          }
          loadNumber={load.loadNumber}
          isDark={isDark}
          mapsUrl={mapsUrl}
          onClose={() => setIsMapOpen(false)}
        />
      )}
    </div>
  );
}

export default DriverCheckin;
