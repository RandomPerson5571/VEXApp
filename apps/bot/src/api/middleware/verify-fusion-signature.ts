import { createHmac, timingSafeEqual } from "node:crypto";

import type { NextFunction, Response } from "express";

import { config } from "../../config.js";
import type { RequestWithRawBody } from "../types/request.js";

export function verifyFusionSignature(
  request: RequestWithRawBody,
  response: Response,
  next: NextFunction,
): void {
  const secret = config.fusionWebhookSecret;
  if (!secret) {
    response.status(503).json({ error: "Fusion webhooks are not configured." });
    return;
  }

  const signature = request.header("x-adsk-signature");
  if (!signature) {
    response.status(401).json({ error: "Missing Fusion signature." });
    return;
  }

  const rawBody = request.rawBody;
  if (!rawBody) {
    response.status(400).json({ error: "Missing request body." });
    return;
  }

  const expected = `sha1hash=${createHmac("sha1", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    response.status(401).json({ error: "Invalid Fusion signature." });
    return;
  }

  next();
}
