import type { User as AuthUser } from "@supabase/supabase-js";
import { connection } from "next/server";
import { headers } from "next/headers";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** Set by the request proxy after `getUser()` validates the session. */
export const PROXY_AUTH_VALIDATED_HEADER = "x-auth-validated";
export const PROXY_AUTH_USER_ID_HEADER = "x-auth-user-id";

/**
 * Resolves the authenticated Supabase user once per request.
 *
 * Always uses `getUser()` so the Auth server validates the session. When the
 * request proxy has already validated the session it sets `x-auth-validated` /
 * `x-auth-user-id`; we reject a user id that does not match that header.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  await connection();

  const supabase = await createClient();
  const headerStore = await headers();
  const validatedByProxy =
    headerStore.get(PROXY_AUTH_VALIDATED_HEADER) === "1";
  const proxyUserId = headerStore.get(PROXY_AUTH_USER_ID_HEADER);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  if (validatedByProxy && proxyUserId && user.id !== proxyUserId) {
    return null;
  }

  return user;
});
