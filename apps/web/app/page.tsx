import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  createPageMetadata,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "VEX Team Hub for Competition Season",
  description: SITE_DESCRIPTION,
  path: "/",
});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
      description: SITE_DESCRIPTION,
      logo: `${getSiteUrl()}/icon.png`,
    },
  ],
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  if (params) {
    const code = params.code;

    if (typeof code === "string" && code.trim()) {
      const target = new URL("/auth/callback", "https://stlvexapp.guanine.org");

      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string" && value) {
          target.searchParams.set(key, value);
        } else if (Array.isArray(value)) {
          target.searchParams.set(key, value.join(","));
        }
      }

      redirect(target.toString());
    }
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <LandingPage />
    </>
  );
}
