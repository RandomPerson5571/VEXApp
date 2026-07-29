"use client";

import { useUser } from "@/components/providers/UserProvider";
import {
  isUserSuppressed,
  suppressedUntilLabel,
} from "@/lib/auth/moderation";

export function SuppressionBanner() {
  const { profile, moderationReason } = useUser();

  if (!isUserSuppressed(profile)) {
    return null;
  }

  const until = profile.suppressedUntil!;

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 border-b border-red-700 bg-red-600 px-4 py-3 text-sm text-white shadow-md"
    >
      <p className="font-semibold">
        Your account is currently in read-only mode until{" "}
        {suppressedUntilLabel(until)}. Contact a team leader.
      </p>
      {moderationReason ? (
        <p className="mt-1 text-xs text-red-100">Reason: {moderationReason}</p>
      ) : null}
    </div>
  );
}
