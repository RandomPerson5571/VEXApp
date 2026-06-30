import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getInviteCodeFromCookies,
  INVITE_COOKIE,
  resolveInviteForAuthUser,
} from "@/lib/auth/invite";

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

function mockCookieStore(value: string | undefined) {
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === INVITE_COOKIE && value
        ? { name: INVITE_COOKIE, value }
        : undefined,
    delete: vi.fn(),
  });
}

describe("invite cookie resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookieStore(undefined);
  });

  it("returns null when the invite cookie is absent", async () => {
    await expect(getInviteCodeFromCookies()).resolves.toBeNull();
  });

  it("prefers metadata invite_code over the cookie", async () => {
    mockCookieStore("cookie-code");

    const findUnique = vi.spyOn(prisma.invite, "findUnique").mockResolvedValue({
      id: "metadata-code",
      teamId: "team-1",
      maxUses: 1,
      usesCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      reservedByUserId: null,
      reservedAt: null,
      createdAt: new Date(),
    });

    const result = await resolveInviteForAuthUser({
      id: "user-1",
      user_metadata: { invite_code: "metadata-code" },
    });

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "metadata-code" },
      }),
    );
    expect(result.invite?.id).toBe("metadata-code");
    expect(result.refreshCookie).toBe(true);
  });

  it("falls back to the cookie when metadata is absent", async () => {
    mockCookieStore("cookie-code");

    const findUnique = vi.spyOn(prisma.invite, "findUnique").mockResolvedValue({
      id: "cookie-code",
      teamId: "team-1",
      maxUses: 1,
      usesCount: 0,
      expiresAt: new Date(Date.now() + 60_000),
      reservedByUserId: null,
      reservedAt: null,
      createdAt: new Date(),
    });

    const result = await resolveInviteForAuthUser({
      id: "user-1",
      user_metadata: {},
    });

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cookie-code" },
      }),
    );
    expect(result.invite?.id).toBe("cookie-code");
    expect(result.refreshCookie).toBe(false);
  });
});
