import { describe, expect, it } from "vitest";

import { formatTimeUntil } from "@/lib/utils/format-time-until";

describe("formatTimeUntil", () => {
  const now = new Date("2026-07-21T12:00:00.000Z");

  it("uses hours when under 24h", () => {
    expect(formatTimeUntil(new Date("2026-07-21T18:00:00.000Z"), now)).toBe(
      "in 6 hours",
    );
  });

  it("says in 1 day for just over 24h (not 2)", () => {
    expect(formatTimeUntil(new Date("2026-07-22T13:00:00.000Z"), now)).toBe(
      "in 1 day",
    );
  });

  it("floors full days beyond that", () => {
    expect(formatTimeUntil(new Date("2026-07-24T12:00:00.000Z"), now)).toBe(
      "in 3 days",
    );
  });
});
