"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/app/(auth)/lib/site-url";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const DISCORD_LINK_RETURN_PATH = "/settings/profile" as const;

function getDiscordLinkReturnPath(returnTo: FormDataEntryValue | null): string {
  const path = getSafeRedirectPath(
    typeof returnTo === "string" ? returnTo : null,
    DISCORD_LINK_RETURN_PATH,
  );

  return path === DISCORD_LINK_RETURN_PATH ? path : DISCORD_LINK_RETURN_PATH;
}

export async function linkDiscordAccount(formData: FormData) {
  const returnPath = getDiscordLinkReturnPath(formData.get("returnTo"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Not%20authenticated");
  }

  const siteUrl = "https://stlvexapp.guanine.org";
  const next = `${returnPath}?message=discord_linked`;
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: `${siteUrl}/auth/callback?flow=link&next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
    redirect(
      `${returnPath}?error=${encodeURIComponent("Discord link did not return a URL")}`,
    );
  }

  redirect(data.url);
}
