import { RateLimitError } from "@/lib/errors/rate-limit-error";

export function throwIfRateLimited(response: Response): void {
  if (response.status !== 429) {
    return;
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfterHeader
    ? Number.parseInt(retryAfterHeader, 10)
    : 60;

  throw new RateLimitError(
    Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 60,
  );
}
