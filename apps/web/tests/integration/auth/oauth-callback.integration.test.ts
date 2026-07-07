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
import {
  buildAuthUser,
} from "../../helpers/auth/supabase-fixtures";

const cookiesMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const resolveAuthUserWithIdentitiesMock = vi.hoisted(() => vi.fn());
const verifySessionIdentityMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/auth/identity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/identity")>();
  return {
    ...actual,
    resolveAuthUserWithIdentities: resolveAuthUserWithIdentitiesMock,
    verifySessionIdentity: verifySessionIdentityMock,
  };
});

import { GET } from "@/app/auth/callback/route";
import { INVITE_COOKIE } from "@/lib/auth/invite";

const ORIGIN = "https://stlvexapp.guanine.org";
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

function setupSupabase(authUser: ReturnType<typeof buildAuthUser> | null) {
  signOutMock.mockResolvedValue({ error: null });
  createClientMock.mockResolvedValue({
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { session: authUser ? { user: authUser } : null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: null,
      }),
      signOut: signOutMock,
      getUserIdentities: vi.fn().mockResolvedValue({
        data: { identities: authUser?.identities ?? [] },
        error: null,
      }),
    },
  });

  resolveAuthUserWithIdentitiesMock.mockImplementation(
    async (_client, user) => user,
  );
  verifySessionIdentityMock.mockResolvedValue({ ok: true });
}

describeIntegration("oauth callback invite reservation", () => {
  let teamId = "";
  let inviteId = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    const team = await createTestTeam();
    teamId = team.id;

    const invite = await createTestInvite(teamId);
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

  it("reserves invite and redirects new users to onboarding", async () => {
    const authUser = buildAuthUser({
      id: TEST_AUTH_USER_A,
      user_metadata: { invite_code: inviteId },
    });
    setupSupabase(authUser);
    mockCookieStore(undefined);

    const response = await GET(
      new Request(`${ORIGIN}/auth/callback?code=test-code&next=/dashboard`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/onboarding");

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(invite?.reservedByUserId).toBe(TEST_AUTH_USER_A);
  });

  it("refreshes cookie when metadata invite differs from cookie invite", async () => {
    const otherInvite = await createTestInvite(teamId);
    const authUser = buildAuthUser({
      id: TEST_AUTH_USER_A,
      user_metadata: { invite_code: inviteId },
    });
    setupSupabase(authUser);
    mockCookieStore(otherInvite.id);

    const response = await GET(
      new Request(`${ORIGIN}/auth/callback?code=test-code`),
    );

    expect(response.status).toBe(307);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(INVITE_COOKIE);
  });

  it("signs out and redirects when no invite is present", async () => {
    setupSupabase(buildAuthUser({ id: TEST_AUTH_USER_A }));
    mockCookieStore(undefined);

    const response = await GET(
      new Request(`${ORIGIN}/auth/callback?code=test-code`),
    );

    expect(signOutMock).toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("/invite-invalid");
  });

  it("redirects login flow without invite to login error", async () => {
    setupSupabase(buildAuthUser({ id: TEST_AUTH_USER_A }));
    mockCookieStore(undefined);

    const response = await GET(
      new Request(`${ORIGIN}/auth/callback?code=test-code&flow=login`),
    );

    expect(response.headers.get("location")).toContain("/login?error=");
  });

  it("signs out when invite is reserved by another user", async () => {
    await prisma.invite.update({
      where: { id: inviteId },
      data: {
        reservedByUserId: TEST_AUTH_USER_B,
        reservedAt: new Date(),
      },
    });

    setupSupabase(
      buildAuthUser({
        id: TEST_AUTH_USER_A,
        user_metadata: { invite_code: inviteId },
      }),
    );
    mockCookieStore(inviteId);

    const response = await GET(
      new Request(`${ORIGIN}/auth/callback?code=test-code`),
    );

    expect(signOutMock).toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("reason=reserved");
  });

  it("redirects existing profiles to next without reserving", async () => {
    await createTestUser(teamId, { id: TEST_AUTH_USER_A, discordId: null });
    setupSupabase(
      buildAuthUser({
        id: TEST_AUTH_USER_A,
        user_metadata: { invite_code: inviteId },
      }),
    );
    mockCookieStore(inviteId);

    const response = await GET(
      new Request(`${ORIGIN}/auth/callback?code=test-code&next=/settings`),
    );

    expect(response.headers.get("location")).toBe(`${ORIGIN}/settings`);

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    expect(invite?.reservedByUserId).toBeNull();
  });
});
