import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { lookupUserProfile } from "@/lib/auth/profile";
import {
  PROXY_AUTH_USER_ID_HEADER,
  PROXY_AUTH_VALIDATED_HEADER,
} from "@/lib/auth/session";
import { isAuthRoute, isProtectedRoute } from "@/lib/auth/routes";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "@/lib/supabase/env";

function copySupabaseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function nextWithAuthHeaders(
  request: NextRequest,
  userId: string | null,
): NextResponse {
  const requestHeaders = new Headers(request.headers);

  if (userId) {
    requestHeaders.set(PROXY_AUTH_VALIDATED_HEADER, "1");
    requestHeaders.set(PROXY_AUTH_USER_ID_HEADER, userId);
  } else {
    requestHeaders.set(PROXY_AUTH_VALIDATED_HEADER, "0");
    requestHeaders.delete(PROXY_AUTH_USER_ID_HEADER);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasSupabaseEnv) {
    return nextWithAuthHeaders(request, null);
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const passThrough = nextWithAuthHeaders(request, user?.id ?? null);
  copySupabaseCookies(supabaseResponse, passThrough);

  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);

    const redirectResponse = NextResponse.redirect(url);
    copySupabaseCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && isAuthRoute(pathname)) {
    const profile = await lookupUserProfile(user.id);

    if (profile.status === "found" || profile.status === "missing") {
      const url = request.nextUrl.clone();
      url.pathname = profile.status === "found" ? "/dashboard" : "/onboarding";

      const redirectResponse = NextResponse.redirect(url);
      copySupabaseCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }

    // DB unavailable — let the auth page surface the error.
    return passThrough;
  }

  return passThrough;
}
