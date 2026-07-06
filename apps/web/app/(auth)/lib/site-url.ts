import { headers } from "next/headers";

const LOCAL_FALLBACK = "http://stlvexapp.guanine.org";

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function getRequestOrigin(headersList: Headers): string | null {
  const origin = headersList.get("origin");

  if (origin) {
    try {
      return normalizeSiteUrl(new URL(origin).origin);
    } catch {
      // fall back to the forwarded host/protocol values below
    }
  }

  const forwardedHeader = headersList.get("x-forwarded-host") ?? headersList.get("forwarded");
  const host = forwardedHeader?.split(",")[0]?.trim();
  const protocol = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (host) {
    const hostValue = host
      .replace(/^host=/i, "")
      .split(";")[0]
      .trim();

    if (hostValue) {
      return normalizeSiteUrl(`${protocol ?? "http"}://${hostValue}`);
    }
  }

  const hostHeader = headersList.get("host")?.split(",")[0]?.trim();

  if (hostHeader) {
    return normalizeSiteUrl(`${protocol ?? "http"}://${hostHeader}`);
  }

  return null;
}

function getConfiguredSiteUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    null
  );
}

// Async, request-header-aware — for OAuth redirects. Metadata/robots/sitemap: lib/seo.ts getSiteUrl()
export async function getSiteUrl(): Promise<string> {
  const headersList = await headers();
  const requestOrigin = getRequestOrigin(headersList);

  if (requestOrigin) {
    return requestOrigin;
  }

  const configured = getConfiguredSiteUrl();

  if (configured) {
    return normalizeSiteUrl(configured);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set in production for OAuth redirect URLs.",
    );
  }

  return LOCAL_FALLBACK;
}
