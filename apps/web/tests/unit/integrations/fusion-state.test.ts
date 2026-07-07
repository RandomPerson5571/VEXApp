import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const STATE_SECRET = "test-fusion-oauth-state-secret";

describe("Fusion OAuth state token", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.FUSION_OAUTH_STATE_SECRET = STATE_SECRET;
  });

  afterEach(() => {
    delete process.env.FUSION_OAUTH_STATE_SECRET;
  });

  async function loadStateModule() {
    return import("@/lib/integrations/fusion/state.server");
  }

  it("signs and verifies a valid OAuth state payload", async () => {
    const { createFusionOAuthState, verifyFusionOAuthState } =
      await loadStateModule();

    const state = createFusionOAuthState("team-1", "user-1");
    const payload = verifyFusionOAuthState(state);

    expect(payload.teamId).toBe("team-1");
    expect(payload.userId).toBe("user-1");
    expect(payload.nonce).toMatch(/^[a-f0-9]{32}$/);
    expect(payload.issuedAt).toBeLessThanOrEqual(Date.now());
  });

  it("rejects tampered signatures", async () => {
    const {
      createFusionOAuthState,
      FusionOAuthStateError,
      verifyFusionOAuthState,
    } = await loadStateModule();

    const state = createFusionOAuthState("team-1", "user-1");
    const [encodedPayload] = state.split(".");
    const tampered = `${encodedPayload}.invalid-signature`;

    expect(() => verifyFusionOAuthState(tampered)).toThrow(
      FusionOAuthStateError,
    );
  });

  it("rejects expired state tokens", async () => {
    const { verifyFusionOAuthState, FusionOAuthStateError } =
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

    expect(() => verifyFusionOAuthState(expiredState)).toThrow(
      FusionOAuthStateError,
    );
  });
});

describe("Fusion connect session token", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.FUSION_CONNECT_SESSION_SECRET = STATE_SECRET;
  });

  afterEach(() => {
    delete process.env.FUSION_CONNECT_SESSION_SECRET;
    delete process.env.FUSION_OAUTH_STATE_SECRET;
  });

  async function loadSessionModule() {
    return import("@/lib/integrations/fusion/connect-session.server");
  }

  it("signs and verifies a connect session with access token", async () => {
    const { createFusionConnectSession, verifyFusionConnectSession } =
      await loadSessionModule();

    const session = createFusionConnectSession(
      "team-1",
      "user-1",
      "access-token-abc",
    );
    const payload = verifyFusionConnectSession(session);

    expect(payload.teamId).toBe("team-1");
    expect(payload.userId).toBe("user-1");
    expect(payload.accessToken).toBe("access-token-abc");
  });
});
