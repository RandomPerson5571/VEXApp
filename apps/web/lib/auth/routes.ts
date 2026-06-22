/** Routes that require an authenticated Supabase session. */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/documents",
  "/calendar",
  "/matches",
  "/build-logs",
  "/inventory",
  "/members",
  "/settings",
] as const;

/** Auth pages that signed-in users should not access. */
export const AUTH_ROUTE_PREFIXES = ["/login", "/signup", "/reset"] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/auth/callback") ||
    isAuthRoute(pathname)
  );
}
