import { beforeEach, describe, expect, it, vi } from "vitest";

const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
}));

vi.mock("@/lib/security/client-ip", () => ({
  getRequestClientIp: () => "203.0.113.10",
}));

const { enforceApiRateLimit } = await import(
  "@/lib/security/enforce-api-rate-limit"
);

describe("enforceApiRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when both user and ip limits allow the request", async () => {
    consumeRateLimitMock.mockResolvedValue({ allowed: true });

    const result = await enforceApiRateLimit(
      new Request("http://localhost/api/day-plans", { method: "PUT" }),
      "user-1",
      "team",
    );

    expect(result).toBeNull();
    expect(consumeRateLimitMock).toHaveBeenNthCalledWith(
      1,
      "api-team:user",
      "user-1",
      { limit: 60, windowMs: 60_000 },
    );
    expect(consumeRateLimitMock).toHaveBeenNthCalledWith(
      2,
      "api-team:ip",
      "203.0.113.10",
      { limit: 120, windowMs: 60_000 },
    );
  });

  it("returns a 429 response when the user bucket is exceeded", async () => {
    consumeRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 42,
    });

    const result = await enforceApiRateLimit(
      new Request("http://localhost/api/day-plans", { method: "PUT" }),
      "user-1",
      "team",
    );

    expect(result?.status).toBe(429);
    expect(result?.headers.get("Retry-After")).toBe("42");
    await expect(result?.json()).resolves.toEqual({
      error: "Too many requests. Please try again later.",
    });
  });
});
