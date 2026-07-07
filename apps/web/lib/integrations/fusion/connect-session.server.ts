import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_TTL_MS = 15 * 60 * 1000;

export type FusionConnectSessionPayload = {
  teamId: string;
  userId: string;
  accessToken: string;
  nonce: string;
  issuedAt: number;
};

export class FusionConnectSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FusionConnectSessionError";
  }
}

function getSessionSecret(): string {
  const secret =
    process.env.FUSION_CONNECT_SESSION_SECRET?.trim() ??
    process.env.FUSION_OAUTH_STATE_SECRET?.trim();

  if (!secret) {
    throw new FusionConnectSessionError(
      "Fusion connect session secret is not configured.",
    );
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createFusionConnectSession(
  teamId: string,
  userId: string,
  accessToken: string,
): string {
  const payload: FusionConnectSessionPayload = {
    teamId,
    userId,
    accessToken,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };

  const secret = getSessionSecret();
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyFusionConnectSession(
  session: string,
): FusionConnectSessionPayload {
  const parts = session.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new FusionConnectSessionError("Invalid connect session format.");
  }

  const [encodedPayload, signature] = parts;
  const secret = getSessionSecret();
  const expectedSignature = signPayload(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new FusionConnectSessionError("Invalid connect session signature.");
  }

  let payload: FusionConnectSessionPayload;

  try {
    payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as FusionConnectSessionPayload;
  } catch {
    throw new FusionConnectSessionError("Invalid connect session payload.");
  }

  if (
    typeof payload.teamId !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.accessToken !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.issuedAt !== "number"
  ) {
    throw new FusionConnectSessionError(
      "Connect session payload is missing required fields.",
    );
  }

  if (Date.now() - payload.issuedAt > SESSION_TTL_MS) {
    throw new FusionConnectSessionError("Connect session has expired.");
  }

  return payload;
}
