import { NextResponse } from "next/server";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import {
  isUserBanned,
  isUserSuppressed,
  suppressedUntilLabel,
} from "@/lib/auth/moderation";

/**
 * Returns 401 if unauthenticated, 403 if banned or suppressed.
 * Call at the start of mutating API routes.
 */
export async function rejectIfBannedOrSuppressed(): Promise<
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      ),
    };
  }

  if (isUserBanned(user.profile)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your account has been banned." },
        { status: 403 },
      ),
    };
  }

  if (isUserSuppressed(user.profile)) {
    const until = user.profile.suppressedUntil!;
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Your account is in read-only mode until ${suppressedUntilLabel(until)}.`,
          suppressedUntil: until.toISOString(),
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}

/** @deprecated Prefer rejectIfBannedOrSuppressed */
export async function rejectIfSuppressed(): Promise<
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse }
> {
  return rejectIfBannedOrSuppressed();
}

export async function rejectIfBanned(): Promise<
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      ),
    };
  }

  if (isUserBanned(user.profile)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your account has been banned." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}
