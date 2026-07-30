import { describe, expect, it } from "vitest";

import {
  isUserSuppressed,
  suppressedUntilLabel,
} from "@/lib/auth/moderation";
import { taskCreatedMessage, taskUpdatedMessage } from "@/lib/telemetry/messages";
import { formatTelemetryDateTime } from "@/lib/telemetry/detail";

describe("telemetry messages", () => {
  it("formats task created and updated messages", () => {
    expect(taskCreatedMessage("Wire intake")).toBe("Task created: **Wire intake**");
    expect(taskUpdatedMessage("Wire intake", ["status", "assignees"])).toBe(
      "Task updated: **Wire intake** (status, assignees)",
    );
  });

  it("formats full date and time for telemetry", () => {
    const formatted = formatTelemetryDateTime("2030-01-15T17:00:00.000Z");
    expect(formatted).toContain("2030-01-15T17:00:00.000Z");
    expect(formatted.length).toBeGreaterThan(20);
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
