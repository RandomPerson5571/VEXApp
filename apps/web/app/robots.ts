import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/auth/",
        "/calendar/",
        "/dashboard/",
        "/documents/",
        "/knowledge/",
        "/inventory/",
        "/invite/",
        "/join/",
        "/login",
        "/matches/",
        "/members/",
        "/onboarding",
        "/reset",
        "/settings/",
        "/signup/",
        "/task-list/",
        "/team-management/",
        "/update-password",
        "/invite-invalid",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
