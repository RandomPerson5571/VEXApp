import type { User as AuthUser } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** Set by the request proxy after `getUser()` validates the session. */
export const PROXY_AUTH_VALIDATED_HEADER = "x-auth-validated";
export const PROXY_AUTH_USER_ID_HEADER = "x-auth-user-id";

/**
 * Resolves the authenticated Supabase user once per request.
 *
 * When the proxy has already called `getUser()`, this reads the session from
 * cookies via `getSession()` instead of making a second Auth server round-trip.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const headerStore = await headers();
  const validatedByProxy =
    headerStore.get(PROXY_AUTH_VALIDATED_HEADER) === "1";
  const proxyUserId = headerStore.get(PROXY_AUTH_USER_ID_HEADER);

  if (validatedByProxy && proxyUserId) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user.id === proxyUserId) {
      return session.user;
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});
