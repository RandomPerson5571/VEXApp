import type { User } from "@stlvex/database/types";

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isUserSuppressed(
  user: Pick<User, "suppressedUntil"> | { suppressedUntil?: Date | string | null },
  now: Date = new Date(),
): boolean {
  const until = asDate(user.suppressedUntil as Date | string | null | undefined);
  if (!until) return false;
  return until.getTime() > now.getTime();
}

export function isUserBanned(
  user: Pick<User, "bannedAt"> | { bannedAt?: Date | string | null },
): boolean {
  return asDate(user.bannedAt as Date | string | null | undefined) != null;
}

export function suppressedUntilLabel(until: Date | string): string {
  const date = asDate(until) ?? new Date(until);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
