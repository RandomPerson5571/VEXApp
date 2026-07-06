import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

import { getSiteUrl } from "@/app/(auth)/lib/site-url";

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    headersMock.mockReset();
  });

  it("prefers the current request host over a configured localhost fallback", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    headersMock.mockResolvedValue({
      get: (name: string) => {
        switch (name) {
          case "x-forwarded-host":
            return "stlvexapp.guanine.org";
          case "x-forwarded-proto":
            return "https";
          default:
            return null;
        }
      },
    });

    await expect(getSiteUrl()).resolves.toBe("https://stlvexapp.guanine.org");
  });
});
