const POSTGRES_SCHEMES = /^postgres(?:ql)?(?:\+[\w.-]+)?$/i;

function decodeCredential(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Supabase docs wrap passwords in brackets — strip if the whole value is wrapped. */
function unwrapBracketNotation(value: string): string {
  if (value.length >= 2 && value.startsWith("[") && value.endsWith("]")) {
    return value.slice(1, -1);
  }
  return value;
}

function encodeCredential(value: string): string {
  return encodeURIComponent(unwrapBracketNotation(decodeCredential(value)));
}

/**
 * Ensures userinfo in a Postgres connection URL is URL-safe.
 * Handles raw passwords with special characters (? = + * @ : / etc.)
 * and idempotently re-normalizes already-encoded credentials.
 */
export function normalizeDatabaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  const schemeSeparator = trimmed.indexOf("://");
  if (schemeSeparator === -1) {
    return trimmed;
  }

  const scheme = trimmed.slice(0, schemeSeparator);
  if (!POSTGRES_SCHEMES.test(scheme)) {
    return trimmed;
  }

  const authorityAndPath = trimmed.slice(schemeSeparator + 3);
  const atIndex = authorityAndPath.lastIndexOf("@");
  if (atIndex === -1) {
    return trimmed;
  }

  const credentials = authorityAndPath.slice(0, atIndex);
  const hostPathAndQuery = authorityAndPath.slice(atIndex + 1);

  const colonIndex = credentials.indexOf(":");
  const user =
    colonIndex === -1 ? credentials : credentials.slice(0, colonIndex);
  const password = colonIndex === -1 ? "" : credentials.slice(colonIndex + 1);

  const encodedUser = encodeCredential(user);
  const encodedPassword = encodeCredential(password);

  const userinfo =
    password.length > 0
      ? `${encodedUser}:${encodedPassword}`
      : encodedUser;

  return `${scheme}://${userinfo}@${hostPathAndQuery}`;
}

export function normalizeDatabaseEnv(): void {
  for (const key of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const value = process.env[key];
    if (value) {
      process.env[key] = normalizeDatabaseUrl(value);
    }
  }
}
