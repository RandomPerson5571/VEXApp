import { headers } from "next/headers";

const LOCAL_FALLBACK = "http://localhost:3000";

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

  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headersList.get("host")?.split(",")[0]?.trim();
  const protocol =
    headersList.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";

  if (host) {
    return normalizeSiteUrl(`${protocol}://${host}`);
  }

  return null;
}

export async function getSiteUrl(): Promise<string> {
  const headersList = await headers();
  const requestOrigin = getRequestOrigin(headersList);

  if (requestOrigin) {
    return requestOrigin;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

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
