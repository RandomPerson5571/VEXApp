import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("POST /api/webhooks integration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.WEBHOOK_SECRET = "vitest-webhook-secret";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("accepts valid webhook secret and payload shape", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();

    const response = await request(app)
      .post("/api/webhooks")
      .set("x-webhook-secret", "vitest-webhook-secret")
      .send({
        type: "telemetry.info",
        payload: {
          guildId: "guild-1",
          teamId: "team-1",
          message: "Task created",
          action: "task.created",
        },
      });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      accepted: true,
      type: "telemetry.info",
    });
  });

  it("rejects invalid webhook secret", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();

    const response = await request(app)
      .post("/api/webhooks")
      .set("x-webhook-secret", "wrong-secret")
      .send({
        type: "telemetry.info",
        payload: { guildId: "guild-1", message: "test" },
      });

    expect(response.status).toBe(401);
  });

  it("accepts task.assigned events", async () => {
    const { createTestWebhookApp: createApp } = await import(
      "../../helpers/webhook-app.js"
    );
    const app = createApp();

    const response = await request(app)
      .post("/api/webhooks")
      .set("x-webhook-secret", "vitest-webhook-secret")
      .send({
        type: "task.assigned",
        payload: {
          teamId: "team-1",
          taskId: "task-1",
          title: "Build intake",
          assigneeUserIds: ["user-1"],
        },
      });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      accepted: true,
      type: "task.assigned",
    });
  });
});
