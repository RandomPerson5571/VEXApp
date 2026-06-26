"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/app/(auth)/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function linkDiscordAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Not%20authenticated");
  }

  const siteUrl = await getSiteUrl();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/settings?message=discord_linked")}`,
    },
  });

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
    redirect("/settings?error=Discord%20link%20did%20not%20return%20a%20URL");
  }

  redirect(data.url);
}
