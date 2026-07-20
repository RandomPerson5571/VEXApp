import type { Metadata } from "next";

const LOCAL_FALLBACK = "http://localhost:3000";

export const SITE_NAME = "STL Robotics";

export const SITE_DESCRIPTION =
  "Team hub for STL Robotics. Manage matches, build logs, inventory, calendar, knowledge, and members for the 2026-2027 VRC season.";

export const SITE_KEYWORDS = [
  "VEX Robotics",
  "VRC",
  "STL Robotics",
  "robotics team",
  "team management",
  "competition",
  "VEX V5",
  "robotics competition",
] as const;

// Sync, env-based — for metadata, robots, sitemap. OAuth redirects: app/(auth)/lib/site-url.ts
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? LOCAL_FALLBACK).replace(/\/$/, "");
}

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const OG_IMAGE = {
  url: "/icon.png",
  width: 512,
  height: 512,
  alt: "STL Robotics logo",
} as const;

export const PRIVATE_LAYOUT_METADATA: Metadata = { robots: NO_INDEX_ROBOTS };

export const ROOT_LAYOUT_METADATA: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  applicationName: SITE_NAME,
};

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  index = true,
}: {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
} = {}): Metadata {
  const resolvedTitle = title ?? SITE_NAME;
  const canonical = path === "/" ? getSiteUrl() : `${getSiteUrl()}${path}`;

  return {
    title: resolvedTitle,
    description,
    alternates: { canonical },
    robots: index ? { index: true, follow: true } : NO_INDEX_ROBOTS,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: resolvedTitle,
      description,
      url: canonical,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
