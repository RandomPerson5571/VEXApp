import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  isUserSuppressed,
  suppressedUntilLabel,
} from "@/lib/auth/moderation";
import { taskCreatedMessage, taskUpdatedMessage } from "@/lib/telemetry/messages";

const findUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@stlvex/database", () => ({
  prisma: {
    team: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("telemetry messages", () => {
  it("formats task created and updated messages", () => {
    expect(taskCreatedMessage("Wire intake")).toBe("Task created: **Wire intake**");
    expect(taskUpdatedMessage("Wire intake", ["status", "assignees"])).toBe(
      "Task updated: **Wire intake** (status, assignees)",
    );
  });
});

describe("resolveGuildIdForTeam cache", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("caches guild id for repeated lookups", async () => {
    findUniqueMock.mockResolvedValue({ discordServerId: "guild-123" });

    const { resolveGuildIdForTeam: resolve } = await import(
      "@/lib/telemetry/resolve"
    );

    await expect(resolve("team-a")).resolves.toBe("guild-123");
    await expect(resolve("team-a")).resolves.toBe("guild-123");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
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
