import "../../helpers/config-mock.js";

import { Webhooks } from "@octokit/webhooks";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getGithubWebhookSecret,
  resetRouteTestSecrets,
  setGithubWebhookSecret,
} from "../../helpers/config-mock.js";

describe("POST /api/github integration", () => {
  beforeEach(() => {
    resetRouteTestSecrets();
    vi.resetModules();
  });

  afterEach(() => {
    resetRouteTestSecrets();
    vi.resetModules();
  });

  it("accepts valid HMAC signatures", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();
    const payload = JSON.stringify({ zen: "test" });
    const webhooks = new Webhooks({ secret: getGithubWebhookSecret() });
    const signature = await webhooks.sign(payload);

    const response = await request(app)
      .post("/api/github")
      .set("x-github-event", "ping")
      .set("x-hub-signature-256", signature)
      .set("content-type", "application/json")
      .send(payload);

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ accepted: true, source: "github" });
  });

  it("rejects invalid signatures", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();
    const payload = JSON.stringify({ zen: "test" });

    const response = await request(app)
      .post("/api/github")
      .set("x-github-event", "ping")
      .set("x-hub-signature-256", "sha256=deadbeef")
      .set("content-type", "application/json")
      .send(payload);

    expect(response.status).toBe(401);
  });

  it("returns 503 when webhook secret is missing", async () => {
    setGithubWebhookSecret("");
    vi.resetModules();

    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();

    const response = await request(app)
      .post("/api/github")
      .set("x-github-event", "ping")
      .set("x-hub-signature-256", "sha256=abc")
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
      .post("/api/github")
      .set("x-github-event", "ping")
      .set("x-hub-signature-256", "sha256=abc")
      .send({ zen: "test" });

    expect(response.status).toBe(400);
  });
});
