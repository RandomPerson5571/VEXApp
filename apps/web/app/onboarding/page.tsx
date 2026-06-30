import { prisma } from "@stlvex/database";
import { redirect } from "next/navigation";

import { getUser } from "@/app/(auth)/lib/session";
import {
  clearInviteCookie,
  getInviteCodeFromCookies,
  getInviteFailureReason,
  getInviteInvalidReasonForAuthUser,
  getValidInviteFromCookies,
  resolveInviteForAuthUser,
  type InviteJoinFailureReason,
  type ValidInvite,
} from "@/lib/auth/invite";
import { isDiscordAuthUser } from "@/lib/auth/identity";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./onboarding-client";

type OnboardingPageProps = {
  searchParams?: Promise<{ next?: string; message?: string }>;
};

async function redirectInviteInvalid(
  reason?: InviteJoinFailureReason,
): Promise<never> {
  const code = await getInviteCodeFromCookies();
  await clearInviteCookie();
  const resolvedReason =
    reason ?? (code ? await getInviteFailureReason(code) : "not_found");
  redirect(`/invite-invalid?reason=${resolvedReason}`);
}

async function signOutAndRedirectInviteInvalid(
  reason: InviteJoinFailureReason,
): Promise<never> {
  await clearInviteCookie();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/invite-invalid?reason=${reason}`);
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const user = await getUser();

  if (user) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (profile) {
      redirect("/dashboard");
    }
  }

  let invite: ValidInvite;

  if (user) {
    const resolved = await resolveInviteForAuthUser(user);

    if (!resolved.invite) {
      const reason = await getInviteInvalidReasonForAuthUser(user);
      await signOutAndRedirectInviteInvalid(reason);
    }

    invite = resolved.invite!;
  } else {
    const cookieInvite = await getValidInviteFromCookies();

    if (!cookieInvite) {
      await redirectInviteInvalid();
    }

    invite = cookieInvite!;
  }

  const team = await prisma.team.findUnique({
    where: { id: invite.teamId },
    select: { name: true, number: true },
  });

  if (!team) {
    if (user) {
      await signOutAndRedirectInviteInvalid("not_found");
    }

    await redirectInviteInvalid("not_found");
  }

  const readyTeam = team!;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = getSafeRedirectPath(resolvedSearchParams?.next);
  const needsEmailConfirmation = Boolean(
    user && !isDiscordAuthUser(user) && !user.email_confirmed_at,
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <OnboardingClient
        teamName={readyTeam.name}
        teamNumber={readyTeam.number}
        step={user ? "profile" : "verify"}
        authEmail={user?.email}
        redirectTo={redirectTo}
        needsEmailConfirmation={needsEmailConfirmation}
        message={resolvedSearchParams?.message}
      />
    </div>
  );
}
