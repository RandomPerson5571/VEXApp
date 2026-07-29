import { describe, expect, it } from "vitest";

import {
  isUserSuppressed,
  suppressedUntilLabel,
} from "@/lib/auth/moderation";
import {
  shouldClearRestockPending,
  shouldFireLowStockAlert,
  resolveLowStockThreshold,
} from "@/lib/inventory/low-stock";
import {
  formatDigestSummary,
  mergeDigestCounters,
  TELEMETRY_EVENTS,
} from "@/lib/telemetry/events";

describe("telemetry urgency map", () => {
  it("maps routine / actionable / security events", () => {
    expect(TELEMETRY_EVENTS.tasksCompleted).toBe("routine");
    expect(TELEMETRY_EVENTS.lowStock).toBe("actionable");
    expect(TELEMETRY_EVENTS.userSuppressed).toBe("security");
    expect(TELEMETRY_EVENTS.userBanned).toBe("security");
    expect(TELEMETRY_EVENTS.userUnbanned).toBe("security");
  });
});

describe("mergeDigestCounters", () => {
  it("sums counters", () => {
    expect(
      mergeDigestCounters(
        { tasksCompleted: 3, partsReturned: 1 },
        { tasksCompleted: 2, scoutNotesSaved: 1 },
      ),
    ).toEqual({
      tasksCompleted: 5,
      partsReturned: 1,
      scoutNotesSaved: 1,
    });
  });

  it("formats digest summary", () => {
    expect(
      formatDigestSummary({ tasksCompleted: 14, partsReturned: 5 }),
    ).toBe("14 tasks completed, 5 parts returned");
  });
});

describe("low-stock closed loop", () => {
  it("uses explicit threshold when set", () => {
    expect(resolveLowStockThreshold(10, 2)).toBe(2);
  });

  it("falls back to 25% heuristic", () => {
    expect(resolveLowStockThreshold(8, null)).toBe(2);
  });

  it("fires once when below threshold and not muted", () => {
    expect(
      shouldFireLowStockAlert({
        available: 1,
        totalStock: 10,
        lowStockThreshold: 2,
        restockPending: false,
      }),
    ).toBe(true);
  });

  it("does not re-fire while restockPending", () => {
    expect(
      shouldFireLowStockAlert({
        available: 0,
        totalStock: 10,
        lowStockThreshold: 2,
        restockPending: true,
      }),
    ).toBe(false);
  });

  it("clears mute when stock recovers", () => {
    expect(
      shouldClearRestockPending({
        available: 5,
        totalStock: 10,
        lowStockThreshold: 2,
        restockPending: true,
      }),
    ).toBe(true);
  });
});

describe("isUserSuppressed", () => {
  it("is false when unset or past", () => {
    expect(isUserSuppressed({ suppressedUntil: null })).toBe(false);
    expect(
      isUserSuppressed({ suppressedUntil: new Date(Date.now() - 60_000) }),
    ).toBe(false);
  });

  it("is true when until is in the future", () => {
    const until = new Date(Date.now() + 3_600_000);
    expect(isUserSuppressed({ suppressedUntil: until })).toBe(true);
    expect(isUserSuppressed({ suppressedUntil: until.toISOString() })).toBe(
      true,
    );
  });

  it("formats until label", () => {
    const label = suppressedUntilLabel(new Date("2030-01-15T17:00:00.000Z"));
    expect(label.length).toBeGreaterThan(5);
  });
});
