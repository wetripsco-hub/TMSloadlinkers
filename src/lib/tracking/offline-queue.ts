import { useCallback, useState, useSyncExternalStore } from "react";

export type QueueStatus = "idle" | "pending" | "retrying" | "failed";

export interface OfflineActionState {
  status: QueueStatus;
}

type ActionFn = () => Promise<void>;

interface QueueEntry {
  status: QueueStatus;
  action: ActionFn;
  timer: ReturnType<typeof setTimeout> | null;
}

export const RETRY_DELAYS_MS = [2000, 5000, 10000] as const;
const MAX_RETRIES = RETRY_DELAYS_MS.length;
const IDLE_STATE: OfflineActionState = { status: "idle" };

export interface OfflineQueue {
  getState(key: string): OfflineActionState;
  enqueue(key: string, action: ActionFn): void;
  retry(key: string): void;
  subscribe(listener: () => void): () => void;
  getVersion(): number;
}

export function createOfflineQueue(): OfflineQueue {
  const entries = new Map<string, QueueEntry>();
  const listeners = new Set<() => void>();
  let version = 0;

  function notify() {
    version += 1;
    for (const listener of listeners) listener();
  }

  function run(key: string, retryCount: number) {
    const entry = entries.get(key);
    if (!entry) return;

    entry.status = retryCount === 0 ? "pending" : "retrying";
    entry.timer = null;
    notify();

    entry.action().then(
      () => {
        if (entries.get(key) === entry) {
          entries.delete(key);
          notify();
        }
      },
      () => {
        if (entries.get(key) !== entry) return;

        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS_MS[retryCount];
          entry.timer = setTimeout(() => run(key, retryCount + 1), delay);
          entry.status = "retrying";
          notify();
        } else {
          entry.status = "failed";
          notify();
        }
      }
    );
  }

  return {
    getState(key) {
      return entries.get(key) ?? IDLE_STATE;
    },

    enqueue(key, action) {
      const existing = entries.get(key);
      if (existing && (existing.status === "pending" || existing.status === "retrying")) {
        return;
      }

      const entry: QueueEntry = { status: "pending", action, timer: null };
      entries.set(key, entry);
      run(key, 0);
    },

    retry(key) {
      const entry = entries.get(key);
      if (!entry || entry.status !== "failed") return;

      run(key, 0);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getVersion() {
      return version;
    },
  };
}

export interface UseOfflineActionQueueResult {
  getState(key: string): OfflineActionState;
  enqueue(key: string, action: ActionFn): void;
  retry(key: string): void;
}

export function useOfflineActionQueue(): UseOfflineActionQueueResult {
  const [queue] = useState<OfflineQueue>(createOfflineQueue);

  useSyncExternalStore(queue.subscribe, queue.getVersion, queue.getVersion);

  const enqueue = useCallback((key: string, action: ActionFn) => queue.enqueue(key, action), [queue]);
  const retry = useCallback((key: string) => queue.retry(key), [queue]);
  const getState = useCallback((key: string) => queue.getState(key), [queue]);

  return { enqueue, retry, getState };
}
