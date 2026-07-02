import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireTeamIntegrationAccess } from "@/lib/integrations/github/api-auth.server";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

const TEAM_ID = "team-abc";
const USER_ID = "user-abc";

function mockCurrentUser(overrides: {
  id?: string;
  teamId?: string | null;
} = {}) {
  const teamId =
    overrides.teamId === undefined ? TEAM_ID : overrides.teamId;

  return {
    authUser: { id: overrides.id ?? USER_ID },
    profile: {
      id: overrides.id ?? USER_ID,
      teamId,
    },
    team: null,
  };
}

describe("requireTeamIntegrationAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const result = await requireTeamIntegrationAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: "Not authenticated.",
      });
    }
  });

  it("returns 400 when the user is not on a team", async () => {
    getCurrentUserMock.mockResolvedValue(
      mockCurrentUser({ teamId: null }),
    );

    const result = await requireTeamIntegrationAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      await expect(result.response.json()).resolves.toEqual({
        error: "You must belong to a team to manage integrations.",
      });
    }
  });

  it("returns 403 when the user is not allowed to manage team integrations", async () => {
    getCurrentUserMock.mockResolvedValue(mockCurrentUser());
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: false,
    });

    const result = await requireTeamIntegrationAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        error: "Forbidden.",
      });
      expect(verifyCurrentUserPermissionsMock).toHaveBeenCalledWith(TEAM_ID);
    }
  });

  it("allows a same-team member to manage integrations", async () => {
    getCurrentUserMock.mockResolvedValue(mockCurrentUser());
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId: TEAM_ID,
      role: "MEMBER",
    });

    const result = await requireTeamIntegrationAccess();

    expect(result).toEqual({
      ok: true,
      teamId: TEAM_ID,
      userId: USER_ID,
    });
    expect(verifyCurrentUserPermissionsMock).toHaveBeenCalledWith(TEAM_ID);
  });

  it("allows a global admin to manage integrations", async () => {
    getCurrentUserMock.mockResolvedValue(mockCurrentUser());
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "GLOBAL",
    });

    const result = await requireTeamIntegrationAccess();

    expect(result).toEqual({
      ok: true,
      teamId: TEAM_ID,
      userId: USER_ID,
    });
  });

  it("rejects blank team ids before permission checks", async () => {
    getCurrentUserMock.mockResolvedValue(mockCurrentUser({ teamId: "   " }));

    const result = await requireTeamIntegrationAccess();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response).toBeInstanceOf(NextResponse);
      expect(result.response.status).toBe(400);
    }
    expect(verifyCurrentUserPermissionsMock).not.toHaveBeenCalled();
  });
});
