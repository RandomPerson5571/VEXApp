import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { canCreateInvites, verifyUserPermissions } from "@/lib/auth/auth-guards";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("verifyCurrentUserPermissions integration", () => {
  let teamAId = "";
  let teamBId = "";
  let adminId = "";
  let leaderId = "";
  let memberId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const teamA = await createTestTeam();
    const teamB = await createTestTeam();
    teamAId = teamA.id;
    teamBId = teamB.id;

    const admin = await createTestUser(teamAId, { isAdmin: true });
    const leader = await createTestUser(teamAId, { role: "TEAM_LEADER" });
    const member = await createTestUser(teamAId, { role: "TEAM_MEMBER" });

    adminId = admin.id;
    leaderId = leader.id;
    memberId = member.id;
  });

  afterEach(async () => {
    if (teamAId) await deleteTestTeam(teamAId);
    if (teamBId) await deleteTestTeam(teamBId);

    teamAId = "";
    teamBId = "";
    adminId = "";
    leaderId = "";
    memberId = "";
  });

  it("grants global scope to admins", async () => {
    getCurrentUserMock.mockResolvedValue({
      profile: { id: adminId, isAdmin: true, teamId: teamAId, role: "ADMIN" },
    });

    await expect(verifyCurrentUserPermissions()).resolves.toEqual({
      authorized: true,
      scope: "GLOBAL",
    });
  });

  it("grants team leader invite permissions on their team", async () => {
    const permissions = verifyUserPermissions(
      {
        profile: {
          isAdmin: false,
          teamId: teamAId,
          role: "TEAM_LEADER",
        },
      },
      teamAId,
    );

    expect(canCreateInvites(permissions)).toBe(true);
  });

  it("denies cross-team access for members", async () => {
    const permissions = verifyUserPermissions(
      {
        profile: {
          isAdmin: false,
          teamId: teamAId,
          role: "TEAM_MEMBER",
        },
      },
      teamBId,
    );

    expect(permissions).toEqual({ authorized: false });
  });
});
