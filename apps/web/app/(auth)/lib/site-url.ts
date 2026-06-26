import { headers } from "next/headers";

const LOCAL_FALLBACK = "http://localhost:3000";

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (configured) {
    return normalizeSiteUrl(configured);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set in production for OAuth redirect URLs.",
    );
  }

  const headersList = await headers();
  const origin = headersList.get("origin");

  if (origin) {
    return normalizeSiteUrl(origin);
  }

  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return normalizeSiteUrl(`${protocol}://${host}`);
  }

  return LOCAL_FALLBACK;
}
