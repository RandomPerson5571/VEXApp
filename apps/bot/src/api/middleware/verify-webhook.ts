import type { NextFunction, Request, Response } from "express";

import { config } from "../../config.js";

export function verifyWebhookSecret(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const providedSecret = request.header("x-webhook-secret");

  if (!providedSecret || providedSecret !== config.webhookSecret) {
    response.status(401).json({ error: "Invalid webhook secret." });
    return;
  }

  next();
}
