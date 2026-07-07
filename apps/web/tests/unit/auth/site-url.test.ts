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

  it("prefers the current request host over a configured localhost fallback in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
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

  it("uses configured site URL in production, ignoring request headers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_SITE_URL = "https://stlvexapp.guanine.org";
    headersMock.mockResolvedValue({
      get: (name: string) => {
        switch (name) {
          case "x-forwarded-host":
            return "wrong-host.example.com";
          case "x-forwarded-proto":
            return "https";
          default:
            return null;
        }
      },
    });

    await expect(getSiteUrl()).resolves.toBe("https://stlvexapp.guanine.org");
  });

  it("throws in production when NEXT_PUBLIC_SITE_URL is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    await expect(getSiteUrl()).rejects.toThrow(
      "NEXT_PUBLIC_SITE_URL must be set in production.",
    );
  });
});
