import { describe, expect, it } from "vitest";

import {
  canManageTeamIntegrations,
  canManageTeamRoster,
  canViewTeamRoster,
} from "@/lib/auth/auth-guards";

describe("canManageTeamIntegrations", () => {
  it("allows any same-team member to manage integrations", () => {
    expect(
      canManageTeamIntegrations({
        authorized: true,
        scope: "TEAM",
        teamId: "team-1",
        role: "MEMBER",
      }),
    ).toBe(true);
  });

  it("allows team leaders to manage integrations", () => {
    expect(
      canManageTeamIntegrations({
        authorized: true,
        scope: "TEAM",
        teamId: "team-1",
        role: "TEAM_LEADER",
      }),
    ).toBe(true);
  });

  it("allows global admins to manage integrations", () => {
    expect(
      canManageTeamIntegrations({
        authorized: true,
        scope: "GLOBAL",
      }),
    ).toBe(true);
  });

  it("denies users without team access", () => {
    expect(canManageTeamIntegrations({ authorized: false })).toBe(false);
  });
});

describe("roster permissions stay leader-only", () => {
  it("lets members view the roster but not manage it", () => {
    const memberPermissions = {
      authorized: true as const,
      scope: "TEAM" as const,
      teamId: "team-1",
      role: "MEMBER" as const,
    };

    expect(canViewTeamRoster(memberPermissions)).toBe(true);
    expect(canManageTeamRoster(memberPermissions)).toBe(false);
    expect(canManageTeamIntegrations(memberPermissions)).toBe(true);
  });
});
