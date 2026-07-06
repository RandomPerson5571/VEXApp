import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 15 * 60 * 1000;

export type GitHubInstallStatePayload = {
  teamId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
};

export class GitHubInstallStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubInstallStateError";
  }
}

function getStateSecret(): string {
  const secret = process.env.GITHUB_INSTALL_STATE_SECRET?.trim();

  if (!secret) {
    throw new GitHubInstallStateError(
      "GitHub install state secret is not configured.",
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

export function createGitHubInstallState(
  teamId: string,
  userId: string,
): string {
  const payload: GitHubInstallStatePayload = {
    teamId,
    userId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };

  const secret = getStateSecret();
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyGitHubInstallState(
  state: string,
): GitHubInstallStatePayload {
  const parts = state.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new GitHubInstallStateError("Invalid state format.");
  }

  const [encodedPayload, signature] = parts;
  const secret = getStateSecret();
  const expectedSignature = signPayload(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new GitHubInstallStateError("Invalid state signature.");
  }

  let payload: GitHubInstallStatePayload;

  try {
    payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as GitHubInstallStatePayload;
  } catch {
    throw new GitHubInstallStateError("Invalid state payload.");
  }

  if (
    typeof payload.teamId !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.issuedAt !== "number"
  ) {
    throw new GitHubInstallStateError("State payload is missing required fields.");
  }

  if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
    throw new GitHubInstallStateError("State has expired.");
  }

  return payload;
}
