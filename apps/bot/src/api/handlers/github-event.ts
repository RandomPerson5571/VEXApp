import type { WebhookContext } from "../context.js";

export async function handleGitHubEvent(
  _context: WebhookContext,
  event: string,
  payload: unknown,
): Promise<void> {
  if (event === "ping") {
    console.log("[github:ping] webhook endpoint verified");
    return;
  }

  const repository =
    payload &&
    typeof payload === "object" &&
    "repository" in payload &&
    payload.repository &&
    typeof payload.repository === "object" &&
    "full_name" in payload.repository &&
    typeof payload.repository.full_name === "string"
      ? payload.repository.full_name
      : undefined;

  console.log(`[github:${event}] repository=${repository ?? "unknown"}`);
}
