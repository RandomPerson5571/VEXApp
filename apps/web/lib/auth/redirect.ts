const DEFAULT_REDIRECT = "/dashboard";

function isSafeRedirectPath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    !path.includes("\\") &&
    !path.includes("@") &&
    !/[\x00-\x1f\x7f]/.test(path)
  );
}

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (typeof path === "string" && isSafeRedirectPath(path)) {
    return path;
  }

  return fallback;
}

export function resolveSameOriginRedirect(
  path: string | null | undefined,
  origin: string,
  fallback = DEFAULT_REDIRECT,
): string {
  const safePath = getSafeRedirectPath(path, fallback);

  try {
    const resolved = new URL(safePath, origin);

    if (resolved.origin !== origin) {
      return fallback;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
