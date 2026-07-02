import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  console.error("[webhook] request failed:", error);

  const message =
    error instanceof Error ? error.message : "Unexpected webhook processing error.";

  response.status(500).json({ error: message });
}
