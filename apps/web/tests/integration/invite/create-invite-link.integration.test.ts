import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());
const getSiteUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

vi.mock("@/app/(auth)/lib/site-url", () => ({
  getSiteUrl: getSiteUrlMock,
}));

import { createInviteLink } from "@/app/(dashboard)/invite/actions";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("createInviteLink integration", () => {
  let teamId = "";
  let leaderId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    getSiteUrlMock.mockResolvedValue("https://example.test");

    const team = await createTestTeam();
    teamId = team.id;

    const leader = await createTestUser(teamId, {
      role: "TEAM_LEADER",
    });
    leaderId = leader.id;
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    leaderId = "";
  });

  it("creates an invite for team leaders", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId,
      role: "TEAM_LEADER",
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = await createInviteLink({ teamId, maxUses: 2, expiresAt });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.link).toContain("/join/");
      const invite = await prisma.invite.findUnique({ where: { id: result.inviteId } });
      expect(invite?.teamId).toBe(teamId);
      expect(invite?.maxUses).toBe(2);
    }
  });

  it("rejects members without invite permission", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId,
      role: "MEMBER",
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = await createInviteLink({ teamId, maxUses: 1, expiresAt });

    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to create invites for this team.",
    });
    expect(await prisma.invite.count({ where: { teamId } })).toBe(0);
  });

  it("rejects past expiry dates", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId,
      role: "TEAM_LEADER",
    });

    const result = await createInviteLink({
      teamId,
      maxUses: 1,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    expect(result).toEqual({
      ok: false,
      error: "Expiry date must be in the future.",
    });
    expect(await prisma.invite.count({ where: { teamId } })).toBe(0);
  });
});
