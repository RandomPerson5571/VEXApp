import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const getAuthUserMock = vi.hoisted(() => vi.fn());
const enforceApiRateLimitMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const supabaseSignOutMock = vi.hoisted(() => vi.fn());

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    connection: async () => undefined,
  };
});

vi.mock("@/lib/auth/session", () => ({
  getAuthUser: getAuthUserMock,
}));

vi.mock("@/lib/auth/identity", () => ({
  verifySessionIdentity: async () => ({ ok: true }),
  getDiscordAvatarUrlFromAuthUser: () => null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signOut: supabaseSignOutMock },
  }),
}));

vi.mock("@/lib/auth/current-user", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/auth/current-user")
  >("@/lib/auth/current-user");
  return {
    ...actual,
    getCurrentUser: getCurrentUserMock,
  };
});

vi.mock("@/lib/security/enforce-api-rate-limit", () => ({
  enforceApiRateLimit: enforceApiRateLimitMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        signOut: signOutMock,
      },
    },
  }),
}));

vi.mock("@/lib/telemetry/dispatch", () => ({
  dispatchTelemetry: vi.fn(),
}));

import { POST as banPost } from "@/app/api/moderation/ban/route";
import { GET as dashboardSummaryGet } from "@/app/api/dashboard/summary/route";
import { getCurrentUserState } from "@/lib/auth/current-user";
import { banUser as banUserAction } from "@/lib/data/moderation";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("moderation ban security", () => {
  let teamId = "";
  let adminId = "";
  let leaderId = "";
  let memberId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    enforceApiRateLimitMock.mockResolvedValue(null);
    signOutMock.mockResolvedValue({ error: null });
    supabaseSignOutMock.mockResolvedValue({ error: null });

    const team = await createTestTeam();
    teamId = team.id;

    const admin = await createTestUser(teamId, { isAdmin: true });
    const leader = await createTestUser(teamId, { role: "TEAM_LEADER" });
    const member = await createTestUser(teamId, { role: "TEAM_MEMBER" });
    adminId = admin.id;
    leaderId = leader.id;
    memberId = member.id;
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }
    teamId = "";
    adminId = "";
    leaderId = "";
    memberId = "";
  });

  it("returns 403 when a team leader attempts to ban", async () => {
    const leader = await prisma.user.findUniqueOrThrow({
      where: { id: leaderId },
    });
    getCurrentUserMock.mockResolvedValue({
      profile: leader,
      team: { id: teamId },
      authUser: { id: leaderId },
      discordAvatarUrl: null,
      moderationReason: null,
    });

    const response = await banPost(
      new Request("https://example.test/api/moderation/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId, reason: "spoofed" }),
      }),
    );

    expect(response.status).toBe(403);
    const target = await prisma.user.findUniqueOrThrow({
      where: { id: memberId },
    });
    expect(target.bannedAt).toBeNull();
  });

  it("blocks protected API access after a ban (session kill)", async () => {
    await banUserAction({
      actorId: adminId,
      targetUserId: memberId,
      reason: "toxicity",
    });

    const banned = await prisma.user.findUniqueOrThrow({
      where: { id: memberId },
    });
    expect(banned.bannedAt).not.toBeNull();
    expect(signOutMock).toHaveBeenCalledWith(memberId, "global");

    getAuthUserMock.mockResolvedValue({ id: memberId });
    const state = await getCurrentUserState();
    expect(state.status).toBe("banned");

    getCurrentUserMock.mockResolvedValue(null);
    const response = await dashboardSummaryGet();
    expect(response.status).toBe(401);
  });
});
