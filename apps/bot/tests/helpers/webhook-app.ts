import express from "express";

import { createApiRouter } from "../../src/api/router.js";
import type { BotClient } from "../../src/types.js";
import type { RequestWithRawBody } from "../../src/api/types/request.js";

export function createStubBotClient(): BotClient {
  return {
    isReady: () => true,
  } as BotClient;
}

export function createTestWebhookApp(client: BotClient = createStubBotClient()) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    express.json({
      limit: "64kb",
      verify: (request, _response, buffer) => {
        (request as RequestWithRawBody).rawBody = buffer;
      },
    }),
  );
  app.use("/api", createApiRouter({ client }));
  return app;
}
