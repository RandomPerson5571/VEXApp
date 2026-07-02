import type { Server } from "node:http";

import express from "express";

import { config } from "../config.js";
import type { BotClient } from "../types.js";
import { createApiRouter } from "./router.js";
import { errorHandler } from "./middleware/error-handler.js";
import type { RequestWithRawBody } from "./types/request.js";

export function createWebhookServer(client: BotClient): { app: express.Express; server: Server } {
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
  app.use(errorHandler);

  const server = app.listen(config.webhookPort, () => {
    console.log(`Webhook API listening on port ${config.webhookPort}`);
  });

  return { app, server };
}

export function closeWebhookServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
