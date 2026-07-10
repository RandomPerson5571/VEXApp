export function rateLimitErrorMessage(retryAfterSeconds: number): string {
  const seconds = Math.max(1, retryAfterSeconds);
  return `Too many requests — try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(rateLimitErrorMessage(retryAfterSeconds));
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
