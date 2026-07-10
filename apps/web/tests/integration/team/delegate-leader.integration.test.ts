import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

import { POST } from "@/app/api/team/delegate-leader/route";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("delegate leader integration", () => {
  let teamId = "";
  let memberId = "";
  let leaderId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const team = await createTestTeam();
    teamId = team.id;

    const leader = await createTestUser(teamId, { role: "TEAM_LEADER" });
    const member = await createTestUser(teamId, { role: "TEAM_MEMBER" });
    leaderId = leader.id;
    memberId = member.id;
    getCurrentUserMock.mockResolvedValue({ profile: { id: leaderId } });
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    memberId = "";
    leaderId = "";
  });

  it("promotes a member when caller is team leader", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId,
      role: "TEAM_LEADER",
    });

    const response = await POST(
      new Request("https://example.test/api/team/delegate-leader", {
        method: "POST",
        body: JSON.stringify({ teamId, userId: memberId }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: memberId } })).toMatchObject({
      role: "TEAM_LEADER",
    });
  });

  it("returns 403 for standard members", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId,
      role: "MEMBER",
    });

    const response = await POST(
      new Request("https://example.test/api/team/delegate-leader", {
        method: "POST",
        body: JSON.stringify({ teamId, userId: memberId }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
