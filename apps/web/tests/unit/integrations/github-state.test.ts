import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const STATE_SECRET = "test-github-install-state-secret";

describe("GitHub install state token", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GITHUB_INSTALL_STATE_SECRET = STATE_SECRET;
  });

  afterEach(() => {
    delete process.env.GITHUB_INSTALL_STATE_SECRET;
  });

  async function loadStateModule() {
    return import("@/lib/integrations/github/state.server");
  }

  it("signs and verifies a valid install state payload", async () => {
    const { createGitHubInstallState, verifyGitHubInstallState } =
      await loadStateModule();

    const state = createGitHubInstallState("team-1", "user-1");
    const payload = verifyGitHubInstallState(state);

    expect(payload.teamId).toBe("team-1");
    expect(payload.userId).toBe("user-1");
    expect(payload.nonce).toMatch(/^[a-f0-9]{32}$/);
    expect(payload.issuedAt).toBeLessThanOrEqual(Date.now());
  });

  it("rejects tampered signatures", async () => {
    const { createGitHubInstallState, GitHubInstallStateError, verifyGitHubInstallState } =
      await loadStateModule();

    const state = createGitHubInstallState("team-1", "user-1");
    const [encodedPayload] = state.split(".");
    const tampered = `${encodedPayload}.invalid-signature`;

    expect(() => verifyGitHubInstallState(tampered)).toThrow(
      GitHubInstallStateError,
    );
    expect(() => verifyGitHubInstallState(tampered)).toThrow(
      "Invalid state signature.",
    );
  });

  it("rejects expired state tokens", async () => {
    const { verifyGitHubInstallState, GitHubInstallStateError } =
      await loadStateModule();
    const { createHmac, randomBytes } = await import("node:crypto");

    const payload = {
      teamId: "team-1",
      userId: "user-1",
      nonce: randomBytes(16).toString("hex"),
      issuedAt: Date.now() - 16 * 60 * 1000,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
      "base64url",
    );
    const signature = createHmac("sha256", STATE_SECRET)
      .update(encodedPayload)
      .digest("base64url");
    const expiredState = `${encodedPayload}.${signature}`;

    expect(() => verifyGitHubInstallState(expiredState)).toThrow(
      GitHubInstallStateError,
    );
    expect(() => verifyGitHubInstallState(expiredState)).toThrow(
      "State has expired.",
    );
  });

  it("requires GITHUB_INSTALL_STATE_SECRET to be configured", async () => {
    delete process.env.GITHUB_INSTALL_STATE_SECRET;

    const { createGitHubInstallState, GitHubInstallStateError } =
      await loadStateModule();

    expect(() => createGitHubInstallState("team-1", "user-1")).toThrow(
      GitHubInstallStateError,
    );
  });
});
