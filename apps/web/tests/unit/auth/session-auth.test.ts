import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifySessionIdentity } from "@/lib/auth/identity";
import {
  getAuthUser,
  PROXY_AUTH_USER_ID_HEADER,
  PROXY_AUTH_VALIDATED_HEADER,
} from "@/lib/auth/session";
import {
  buildAuthUser,
  DEFAULT_SUPABASE_USER_ID,
} from "../../helpers/auth/supabase-fixtures";

const headersMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() => vi.fn());
const connectionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/server", () => ({
  connection: connectionMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

const DISCORD_SNOWFLAKE = "987654321098765432";

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

  it("uses getUser when the proxy validated the session", async () => {
    const authUser = buildAuthUser();
    const getUser = vi.fn().mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: { getUser },
    });
    mockProxyHeaders(DEFAULT_SUPABASE_USER_ID);

    await expect(getAuthUser()).resolves.toEqual(authUser);
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("returns null when proxy user id does not match getUser", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: buildAuthUser({ id: "other-user-id" }) },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: { getUser },
    });
    mockProxyHeaders(DEFAULT_SUPABASE_USER_ID);

    await expect(getAuthUser()).resolves.toBeNull();
    expect(getUser).toHaveBeenCalledTimes(1);
  });
});

describe("verifySessionIdentity verified-profile fast path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips profile writes for a verified email user", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: DEFAULT_SUPABASE_USER_ID,
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
          user_id: DEFAULT_SUPABASE_USER_ID,
          identity_id: DISCORD_SNOWFLAKE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
      ],
    });

    const findUnique = vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: DEFAULT_SUPABASE_USER_ID,
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
