import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function createClient(options?: { forwardedIp?: string }) {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    ...(options?.forwardedIp
      ? {
          global: {
            headers: {
              "Sb-Forwarded-For": options.forwardedIp,
            },
          },
        }
      : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies; proxy refreshes sessions.
        }
      },
    },
  });
}
