import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  hasTestDatabase,
} from "../../../helpers/auth/test-database";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

import { POST } from "@/app/api/auth/create-invite/route";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("POST /api/auth/create-invite integration", () => {
  let teamId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    const team = await createTestTeam();
    teamId = team.id;
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
  });

  it("returns 401 when unauthenticated", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(
      new Request("https://example.test/api/auth/create-invite", {
        method: "POST",
        headers: { origin: "https://example.test" },
        body: JSON.stringify({ teamId, maxUses: 1, expiresAt: new Date(Date.now() + 86_400_000).toISOString() }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 for members without invite permission", async () => {
    const user = await createTestUser(teamId, { role: "TEAM_MEMBER" });
    getCurrentUserMock.mockResolvedValue({ profile: user });
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId,
      role: "MEMBER",
    });

    const response = await POST(
      new Request("https://example.test/api/auth/create-invite", {
        method: "POST",
        headers: { origin: "https://example.test" },
        body: JSON.stringify({
          teamId,
          maxUses: 1,
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 for unknown teams", async () => {
    getCurrentUserMock.mockResolvedValue({
      profile: { id: "user-1", teamId, role: "TEAM_LEADER", isAdmin: false },
    });
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId: "missing-team",
      role: "TEAM_LEADER",
    });

    const response = await POST(
      new Request("https://example.test/api/auth/create-invite", {
        method: "POST",
        headers: { origin: "https://example.test" },
        body: JSON.stringify({
          teamId: "missing-team",
          maxUses: 1,
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        }),
      }),
    );

    expect(response.status).toBe(404);
  });
});
