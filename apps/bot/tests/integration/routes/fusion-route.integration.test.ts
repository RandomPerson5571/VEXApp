import "../../helpers/config-mock.js";

import { createHmac } from "node:crypto";

import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getFusionWebhookSecret,
  resetRouteTestSecrets,
  setFusionWebhookSecret,
} from "../../helpers/config-mock.js";

describe("POST /api/fusion integration", () => {
  beforeEach(() => {
    resetRouteTestSecrets();
    vi.resetModules();
  });

  afterEach(() => {
    resetRouteTestSecrets();
    vi.resetModules();
  });

  function signFusionBody(body: string): string {
    return `sha1hash=${createHmac("sha1", getFusionWebhookSecret()).update(body).digest("hex")}`;
  }

  it("accepts valid Fusion signatures", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();
    const payload = JSON.stringify({
      hook: { event: "dm.version.added", scope: { folder: "urn:test" } },
      payload: { name: "Part" },
    });

    const response = await request(app)
      .post("/api/fusion")
      .set("x-adsk-signature", signFusionBody(payload))
      .set("content-type", "application/json")
      .send(payload);

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ accepted: true, source: "fusion" });
  });

  it("rejects invalid Fusion signatures", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();
    const payload = JSON.stringify({ hook: { event: "test" } });

    const response = await request(app)
      .post("/api/fusion")
      .set("x-adsk-signature", "sha1hash=deadbeef")
      .set("content-type", "application/json")
      .send(payload);

    expect(response.status).toBe(401);
  });

  it("returns 503 when Fusion secret is missing", async () => {
    setFusionWebhookSecret("");
    vi.resetModules();

    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();

    const response = await request(app)
      .post("/api/fusion")
      .set("x-adsk-signature", "sha1hash=abc")
      .set("content-type", "application/json")
      .send("{}");

    expect(response.status).toBe(503);
  });

  it("returns 400 when raw body is missing", async () => {
    const express = (await import("express")).default;
    const { createApiRouter } = await import("../../../src/api/router.js");
    const app = express();
    app.use(express.json());
    app.use("/api", createApiRouter({ client: { isReady: () => true } as never }));

    const response = await request(app)
      .post("/api/fusion")
      .set("x-adsk-signature", signFusionBody("{}"))
      .send({ hook: { event: "test" } });

    expect(response.status).toBe(400);
  });
});
