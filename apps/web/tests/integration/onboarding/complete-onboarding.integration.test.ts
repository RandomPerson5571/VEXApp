import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTestInvite,
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  deleteTestUser,
  hasTestDatabase,
  TEST_AUTH_USER_A,
  TEST_AUTH_USER_B,
} from "../../helpers/auth/test-database";
import { hoursAgo } from "../../helpers/auth/invite-builders";
import {
  buildAuthUser,
} from "../../helpers/auth/supabase-fixtures";

const redirectMock = vi.hoisted(() => vi.fn());
const clearInviteCookieMock = vi.hoisted(() => vi.fn());
const confirmProfileVerificationMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/auth/invite", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/invite")>();
  return {
    ...actual,
    clearInviteCookie: clearInviteCookieMock,
  };
});

vi.mock("@/lib/auth/identity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/identity")>();
  return {
    ...actual,
    confirmProfileVerification: confirmProfileVerificationMock,
  };
});

import { completeOnboarding } from "@/app/onboarding/actions";
import {
  INVITE_COOKIE,
  InviteExhaustedError,
  InviteExpiredError,
  InviteReservedError,
} from "@/lib/auth/invite";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

function mockInviteCookie(inviteId: string | undefined) {
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === INVITE_COOKIE && inviteId
        ? { name: INVITE_COOKIE, value: inviteId }
        : undefined,
    delete: vi.fn(),
  });
}

function mockSignedInUser(userId: string, inviteCode?: string) {
  const authUser = buildAuthUser({
    id: userId,
    email: `${userId}@example.com`,
    email_confirmed_at: new Date().toISOString(),
    user_metadata: inviteCode ? { invite_code: inviteCode } : {},
  });

  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: authUser }, error: null }),
    },
  });

  return authUser;
}

function buildFormData() {
  const formData = new FormData();
  formData.set("firstName", "Test");
  formData.set("lastName", "User");
  return formData;
}

describeIntegration("completeOnboarding integration", () => {
  let teamId = "";
  let inviteId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    redirectMock.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { digest: url });
    });
    confirmProfileVerificationMock.mockResolvedValue(undefined);
    clearInviteCookieMock.mockResolvedValue(undefined);

    const team = await createTestTeam();
    teamId = team.id;

    const invite = await createTestInvite(teamId, {
      reservedByUserId: TEST_AUTH_USER_A,
    });
    inviteId = invite.id;
  });

  afterEach(async () => {
    await deleteTestUser(TEST_AUTH_USER_A).catch(() => undefined);
    await deleteTestUser(TEST_AUTH_USER_B).catch(() => undefined);

    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    inviteId = "";
  });

  it("creates a user, consumes the invite, and redirects on success", async () => {
    mockSignedInUser(TEST_AUTH_USER_A, inviteId);
    mockInviteCookie(inviteId);

    await expect(
      completeOnboarding(null, buildFormData()),
    ).rejects.toMatchObject({ digest: "/dashboard" });

    const user = await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } });
    expect(user?.teamId).toBe(teamId);

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(invite?.usesCount).toBe(1);
    expect(invite?.reservedByUserId).toBeNull();
    expect(clearInviteCookieMock).toHaveBeenCalled();
    expect(confirmProfileVerificationMock).toHaveBeenCalled();
  });

  it("is idempotent when the user already exists", async () => {
    await createTestUser(teamId, { id: TEST_AUTH_USER_A, discordId: null });

    mockSignedInUser(TEST_AUTH_USER_A, inviteId);
    mockInviteCookie(inviteId);

    await expect(
      completeOnboarding(null, buildFormData()),
    ).rejects.toMatchObject({ digest: "/dashboard" });

    expect(await prisma.user.count({ where: { id: TEST_AUTH_USER_A } })).toBe(1);
    expect(
      (await prisma.invite.findUnique({ where: { id: inviteId } }))?.usesCount,
    ).toBe(0);
  });

  it("returns an error when no invite is available", async () => {
    mockSignedInUser(TEST_AUTH_USER_A);
    mockInviteCookie(undefined);

    const result = await completeOnboarding(null, buildFormData());

    expect(result).toEqual({
      error: "Sign up is invite-only. Use a team invite link to create an account.",
    });
    expect(await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } })).toBeNull();
  });

  it("returns an error when the invite is reserved by another user", async () => {
    await prisma.invite.update({
      where: { id: inviteId },
      data: {
        reservedByUserId: TEST_AUTH_USER_B,
        reservedAt: new Date(),
      },
    });

    mockSignedInUser(TEST_AUTH_USER_A, inviteId);
    mockInviteCookie(inviteId);

    const result = await completeOnboarding(null, buildFormData());

    expect(result?.error).toContain("invite");
    expect(await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } })).toBeNull();
  });

  it("returns an error for duplicate discordId", async () => {
    const existingDiscordId = "999888777666555444";
    await createTestUser(teamId, { discordId: existingDiscordId });

    mockSignedInUser(TEST_AUTH_USER_A, inviteId);
    mockInviteCookie(inviteId);

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: buildAuthUser({
              id: TEST_AUTH_USER_A,
              email: "new@example.com",
              email_confirmed_at: new Date().toISOString(),
              app_metadata: { provider: "discord" },
              user_metadata: { invite_code: inviteId, provider_id: existingDiscordId },
              identities: [
                {
                  provider: "discord",
                  identity_data: { sub: existingDiscordId },
                },
              ],
            }),
          },
          error: null,
        }),
      },
    });

    const result = await completeOnboarding(null, buildFormData());

    expect(result?.error).toContain("Discord account is already linked");
    expect(await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } })).toBeNull();
  });
});

describeIntegration("completeOnboarding invite state matrix", () => {
  let teamId = "";
  let inviteId = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    const team = await createTestTeam();
    teamId = team.id;

    const invite = await createTestInvite(teamId, {
      reservedByUserId: TEST_AUTH_USER_A,
    });
    inviteId = invite.id;

    mockSignedInUser(TEST_AUTH_USER_A, inviteId);
    mockInviteCookie(inviteId);
  });

  afterEach(async () => {
    await deleteTestUser(TEST_AUTH_USER_A).catch(() => undefined);

    if (teamId) {
      await deleteTestTeam(teamId);
    }

    teamId = "";
    inviteId = "";
  });

  it("rejects expired invites", async () => {
    await prisma.invite.update({
      where: { id: inviteId },
      data: { expiresAt: hoursAgo(1) },
    });

    const result = await completeOnboarding(null, buildFormData());

    expect(result).toEqual({ error: new InviteExpiredError().message });
    expect(await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } })).toBeNull();
  });

  it("rejects exhausted invites", async () => {
    await prisma.invite.update({
      where: { id: inviteId },
      data: { usesCount: 1, maxUses: 1 },
    });

    const result = await completeOnboarding(null, buildFormData());

    expect(result).toEqual({ error: new InviteExhaustedError().message });
    expect(await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } })).toBeNull();
  });

  it("rejects when another user holds an active reservation", async () => {
    await prisma.invite.update({
      where: { id: inviteId },
      data: {
        reservedByUserId: TEST_AUTH_USER_B,
        reservedAt: new Date(),
      },
    });

    const result = await completeOnboarding(null, buildFormData());

    expect(result).toEqual({ error: new InviteReservedError().message });
    expect(await prisma.user.findUnique({ where: { id: TEST_AUTH_USER_A } })).toBeNull();
  });
});
