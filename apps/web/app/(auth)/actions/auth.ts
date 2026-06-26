"use server";

import { redirect } from "next/navigation";

import { getSiteUrl } from "@/app/(auth)/lib/site-url";
import { verifyEmailCredentialIdentity } from "@/lib/auth/identity";
import {
  getValidInviteFromCookies,
  INVITE_REQUIRED_MESSAGE,
} from "@/lib/auth/invite";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@stlvex/database";

export type AuthState = {
  error: string;
} | null;

function getRedirectPath(formData: FormData) {
  return getSafeRedirectPath(formData.get("redirectTo")?.toString());
}

function getOnboardingRedirect(redirectTo: string) {
  return `/onboarding?next=${encodeURIComponent(redirectTo)}`;
}

async function shouldOnboard(userId: string): Promise<boolean> {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return !profile;
}

export async function signInWithCredentials(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = getRedirectPath(formData);

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return { error: "Please provide correct credentials." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unable to read the authenticated user." };
  }

  const identityCheck = await verifyEmailCredentialIdentity(user);

  if (!identityCheck.ok) {
    await supabase.auth.signOut();
    return { error: identityCheck.error };
  }

  if (await shouldOnboard(user.id)) {
    const invite = await getValidInviteFromCookies();

    if (!invite) {
      await supabase.auth.signOut();
      return { error: INVITE_REQUIRED_MESSAGE };
    }

    redirect(getOnboardingRedirect(redirectTo));
  }

  redirect(redirectTo);
}

export async function signInWithDiscord(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const redirectTo = getRedirectPath(formData);
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.url) {
    return { error: "Discord sign-in did not return a login URL." };
  }

  redirect(data.url);
}

export async function signUpWithCredentials(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const invite = await getValidInviteFromCookies();

  if (!invite) {
    return { error: INVITE_REQUIRED_MESSAGE };
  }

  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const redirectTo = getRedirectPath(formData);

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    return { error: "Please provide all signup details." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(
    redirectTo,
  )}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  const user = data.user;

  if (user && data.session) {
    redirect(
      (await shouldOnboard(user.id))
        ? getOnboardingRedirect(redirectTo)
        : redirectTo,
    );
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Check your email to confirm your account.",
    )}&redirectTo=${encodeURIComponent(redirectTo)}`,
  );
}

export async function signUpWithDiscord(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const invite = await getValidInviteFromCookies();

  if (!invite) {
    return { error: INVITE_REQUIRED_MESSAGE };
  }

  return signInWithDiscord(_prevState, formData);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
