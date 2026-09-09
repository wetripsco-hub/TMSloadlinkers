export interface StopLateness {
  isLate: boolean;
  durationMs: number;
}

export function computeStopLateness(
  windowEnd: string | null,
  arrivedAt: string | null,
  now: Date = new Date()
): StopLateness | null {
  if (!windowEnd) {
    return null;
  }

  const windowEndMs = new Date(windowEnd).getTime();
  const referenceMs = arrivedAt ? new Date(arrivedAt).getTime() : now.getTime();
  const durationMs = referenceMs - windowEndMs;

  if (durationMs <= 0) {
    return { isLate: false, durationMs: 0 };
  }

  return { isLate: true, durationMs };
}

export function formatLatenessDuration(durationMs: number): string {
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m late`;
  }
  if (minutes === 0) {
    return `${hours}h late`;
  }
  return `${hours}h ${minutes}m late`;
}
