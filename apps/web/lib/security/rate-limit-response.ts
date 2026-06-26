import { NextResponse } from "next/server";

import type { RateLimitResult } from "@/lib/security/rate-limit";

export function rateLimitExceededResponse(
  result: Extract<RateLimitResult, { allowed: false }>,
) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
