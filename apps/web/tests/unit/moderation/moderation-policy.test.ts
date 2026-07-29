import { describe, expect, it } from "vitest";

import {
  canModerateTarget,
  normalizeModerationReason,
  type ModerationActor,
  type ModerationTarget,
} from "@stlvex/database/moderation-policy";

const admin = (overrides: Partial<ModerationActor> = {}): ModerationActor => ({
  id: "admin-1",
  isAdmin: true,
  role: "TEAM_MEMBER",
  teamId: "team-a",
  ...overrides,
});

const leader = (overrides: Partial<ModerationActor> = {}): ModerationActor => ({
  id: "leader-1",
  isAdmin: false,
  role: "TEAM_LEADER",
  teamId: "team-a",
  ...overrides,
});

const member = (overrides: Partial<ModerationTarget> = {}): ModerationTarget => ({
  id: "member-1",
  isAdmin: false,
  role: "TEAM_MEMBER",
  teamId: "team-a",
  ...overrides,
});

describe("canModerateTarget", () => {
  it("denies self-targeting", () => {
    const self = admin({ id: "same" });
    expect(canModerateTarget(self, member({ id: "same" }), "kick")).toBe(false);
  });

  it("denies admin acting on another admin", () => {
    expect(
      canModerateTarget(admin(), member({ id: "admin-2", isAdmin: true }), "ban"),
    ).toBe(false);
  });

  it("allows admin timeout/kick/ban on members", () => {
    const target = member();
    expect(canModerateTarget(admin(), target, "suppress")).toBe(true);
    expect(canModerateTarget(admin(), target, "kick")).toBe(true);
    expect(canModerateTarget(admin(), target, "ban")).toBe(true);
  });

  it("denies leader acting on another leader", () => {
    expect(
      canModerateTarget(
        leader(),
        member({ id: "leader-2", role: "TEAM_LEADER" }),
        "kick",
      ),
    ).toBe(false);
  });

  it("denies leader ban/unban", () => {
    expect(canModerateTarget(leader(), member(), "ban")).toBe(false);
    expect(canModerateTarget(leader(), member(), "unban")).toBe(false);
  });

  it("allows leader timeout/kick on same-team members", () => {
    expect(canModerateTarget(leader(), member(), "suppress")).toBe(true);
    expect(canModerateTarget(leader(), member(), "kick")).toBe(true);
  });

  it("denies leader acting on other-team members", () => {
    expect(
      canModerateTarget(leader(), member({ teamId: "team-b" }), "kick"),
    ).toBe(false);
  });

  it("denies regular members all ops", () => {
    const actor = leader({ id: "m1", role: "TEAM_MEMBER" });
    expect(canModerateTarget(actor, member({ id: "m2" }), "kick")).toBe(false);
  });
});

describe("normalizeModerationReason", () => {
  it("falls back when empty", () => {
    expect(normalizeModerationReason("")).toBe("No reason provided");
    expect(normalizeModerationReason(null)).toBe("No reason provided");
    expect(normalizeModerationReason("  spam  ")).toBe("spam");
  });
});
