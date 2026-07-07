import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestInvite,
  createTestTeam,
  deleteTestTeam,
  hasTestDatabase,
  TEST_AUTH_USER_A,
  TEST_AUTH_USER_B,
} from "../../helpers/auth/test-database";

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import {
  getInviteByCode,
  INVITE_COOKIE,
  resolveInviteForAuthUser,
} from "@/lib/auth/invite";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

function mockCookieStore(inviteCode?: string) {
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === INVITE_COOKIE && inviteCode
        ? { name: INVITE_COOKIE, value: inviteCode }
        : undefined,
    delete: vi.fn(),
  });
}

describeIntegration("resolveInviteForAuthUser integration", () => {
  let teamId = "";
  let metadataInviteId = "";
  let cookieInviteId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const team = await createTestTeam();
    teamId = team.id;

    const metadataInvite = await createTestInvite(teamId);
    const cookieInvite = await createTestInvite(teamId);
    metadataInviteId = metadataInvite.id;
    cookieInviteId = cookieInvite.id;
  });

  afterEach(async () => {
    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    metadataInviteId = "";
    cookieInviteId = "";
  });

  it("prefers metadata invite over cookie invite", async () => {
    mockCookieStore(cookieInviteId);

    const result = await resolveInviteForAuthUser({
      id: TEST_AUTH_USER_A,
      user_metadata: { invite_code: metadataInviteId },
    });

    expect(result.invite?.id).toBe(metadataInviteId);
    expect(result.refreshCookie).toBe(true);
  });

  it("falls back to cookie invite when metadata is absent", async () => {
    mockCookieStore(cookieInviteId);

    const result = await resolveInviteForAuthUser({
      id: TEST_AUTH_USER_A,
      user_metadata: {},
    });

    expect(result.invite?.id).toBe(cookieInviteId);
    expect(result.refreshCookie).toBe(false);
  });

  it("returns null when another user holds an active reservation", async () => {
    mockCookieStore(metadataInviteId);

    await prisma.invite.update({
      where: { id: metadataInviteId },
      data: {
        reservedByUserId: TEST_AUTH_USER_B,
        reservedAt: new Date(),
      },
    });

    const result = await resolveInviteForAuthUser({
      id: TEST_AUTH_USER_A,
      user_metadata: { invite_code: metadataInviteId },
    });

    expect(result.invite).toBeNull();
    await expect(getInviteByCode(metadataInviteId, TEST_AUTH_USER_A)).resolves.toBeNull();
  });
});
