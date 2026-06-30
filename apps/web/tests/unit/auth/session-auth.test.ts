import { prisma } from "@stlvex/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifySessionIdentity } from "@/lib/auth/identity";
import {
  getAuthUser,
  PROXY_AUTH_USER_ID_HEADER,
  PROXY_AUTH_VALIDATED_HEADER,
} from "@/lib/auth/session";

const headersMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

const SUPABASE_USER_ID = "22222222-2222-2222-2222-222222222222";
const DISCORD_SNOWFLAKE = "987654321098765432";

function buildAuthUser(
  overrides: Partial<SupabaseUser> = {},
): SupabaseUser {
  return {
    id: SUPABASE_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "user@example.com",
    app_metadata: { provider: "email" },
    user_metadata: { sub: SUPABASE_USER_ID },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    ...overrides,
  } as SupabaseUser;
}

function mockProxyHeaders(userId: string | null) {
  headersMock.mockResolvedValue({
    get: (name: string) => {
      if (name === PROXY_AUTH_VALIDATED_HEADER) {
        return userId ? "1" : "0";
      }
      if (name === PROXY_AUTH_USER_ID_HEADER) {
        return userId;
      }
      return null;
    },
  });
}

describe("getAuthUser proxy fast path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    createClientMock.mockReset();
  });

  it("uses getSession instead of getUser when the proxy validated the session", async () => {
    const authUser = buildAuthUser();
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { user: authUser } },
    });
    const getUser = vi.fn();

    createClientMock.mockResolvedValue({
      auth: { getSession, getUser },
    });
    mockProxyHeaders(SUPABASE_USER_ID);

    await expect(getAuthUser()).resolves.toEqual(authUser);
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("falls back to getUser when proxy user id does not match the session", async () => {
    const authUser = buildAuthUser({ id: "other-user-id" });
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { user: authUser } },
    });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: buildAuthUser() },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: { getSession, getUser },
    });
    mockProxyHeaders(SUPABASE_USER_ID);

    await getAuthUser();
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledTimes(1);
  });
});

describe("verifySessionIdentity verified-profile fast path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips profile writes for a verified email user", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: SUPABASE_USER_ID,
      isVerified: true,
      verificationMethod: "EMAIL",
      discordId: null,
    } as never);
    const update = vi.spyOn(prisma.user, "update");

    const result = await verifySessionIdentity(buildAuthUser());

    expect(result).toEqual({ ok: true });
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it("skips Discord re-verification when profile discordId matches", async () => {
    const discordUser = buildAuthUser({
      app_metadata: { provider: "discord" },
      identities: [
        {
          id: DISCORD_SNOWFLAKE,
          provider: "discord",
          identity_data: { sub: DISCORD_SNOWFLAKE },
          user_id: SUPABASE_USER_ID,
          identity_id: DISCORD_SNOWFLAKE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
      ],
    });

    const findUnique = vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: SUPABASE_USER_ID,
      isVerified: true,
      verificationMethod: "DISCORD",
      discordId: DISCORD_SNOWFLAKE,
    } as never);
    const update = vi.spyOn(prisma.user, "update");

    const result = await verifySessionIdentity(discordUser);

    expect(result).toEqual({ ok: true });
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });
});
