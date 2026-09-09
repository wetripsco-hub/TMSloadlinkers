import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createOfflineQueue, RETRY_DELAYS_MS } from "./offline-queue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createOfflineQueue", () => {
  it("succeeds on the first attempt without retrying", async () => {
    const queue = createOfflineQueue();
    const action = vi.fn().mockResolvedValue(undefined);

    queue.enqueue("at_pickup", action);
    expect(queue.getState("at_pickup").status).toBe("pending");

    await vi.advanceTimersByTimeAsync(0);

    expect(action).toHaveBeenCalledTimes(1);
    expect(queue.getState("at_pickup").status).toBe("idle");
  });

  it("retries after a failure and succeeds on the next attempt", async () => {
    const queue = createOfflineQueue();
    const action = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined);

    queue.enqueue("in_transit", action);
    await vi.advanceTimersByTimeAsync(0);

    expect(action).toHaveBeenCalledTimes(1);
    expect(queue.getState("in_transit").status).toBe("retrying");

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);

    expect(action).toHaveBeenCalledTimes(2);
    expect(queue.getState("in_transit").status).toBe("idle");
  });

  it("fails permanently after exhausting all retries", async () => {
    const queue = createOfflineQueue();
    const action = vi.fn().mockRejectedValue(new Error("network"));

    queue.enqueue("at_delivery", action);
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.getState("at_delivery").status).toBe("retrying");

    for (const delay of RETRY_DELAYS_MS) {
      await vi.advanceTimersByTimeAsync(delay);
    }

    expect(action).toHaveBeenCalledTimes(1 + RETRY_DELAYS_MS.length);
    expect(queue.getState("at_delivery").status).toBe("failed");
  });

  it("de-dupes a double-tap while a request is already in flight", async () => {
    const queue = createOfflineQueue();
    let resolveAction: () => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        })
    );

    queue.enqueue("delivered", action);
    queue.enqueue("delivered", action);
    queue.enqueue("delivered", action);

    expect(action).toHaveBeenCalledTimes(1);
    expect(queue.getState("delivered").status).toBe("pending");

    resolveAction();
    await vi.advanceTimersByTimeAsync(0);

    expect(queue.getState("delivered").status).toBe("idle");
  });

  it("allows a fresh enqueue for the same key once it is idle again", async () => {
    const queue = createOfflineQueue();
    const action = vi.fn().mockResolvedValue(undefined);

    queue.enqueue("delivered", action);
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.getState("delivered").status).toBe("idle");

    queue.enqueue("delivered", action);
    await vi.advanceTimersByTimeAsync(0);

    expect(action).toHaveBeenCalledTimes(2);
  });

  it("does not retry automatically after final failure, but retry() starts a fresh attempt sequence", async () => {
    const queue = createOfflineQueue();
    const action = vi.fn().mockRejectedValue(new Error("network"));

    queue.enqueue("at_pickup", action);
    await vi.advanceTimersByTimeAsync(0);
    for (const delay of RETRY_DELAYS_MS) {
      await vi.advanceTimersByTimeAsync(delay);
    }
    expect(queue.getState("at_pickup").status).toBe("failed");

    const callsBeforeManualRetry = action.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60000);
    expect(action).toHaveBeenCalledTimes(callsBeforeManualRetry);

    action.mockResolvedValueOnce(undefined);
    queue.retry("at_pickup");
    expect(queue.getState("at_pickup").status).toBe("pending");

    await vi.advanceTimersByTimeAsync(0);
    expect(queue.getState("at_pickup").status).toBe("idle");
  });
});
