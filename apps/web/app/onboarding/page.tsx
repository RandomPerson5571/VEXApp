import { prisma } from "@stlvex/database";
import { redirect } from "next/navigation";

import {
  getValidInviteFromCookies,
  INVITE_REQUIRED_MESSAGE,
} from "@/lib/auth/invite";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (profile) {
    redirect("/dashboard");
  }

  const invite = await getValidInviteFromCookies();

  if (!invite) {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent(INVITE_REQUIRED_MESSAGE)}`,
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <OnboardingClient />
    </div>
  );
}
