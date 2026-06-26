"use client";

import { useActionState } from "react";

import { SignupForm } from "@/components/auth/SignupForm";
import {
  signUpWithDiscord,
  signUpWithCredentials,
  type AuthState,
} from "@/app/(auth)/actions/auth";

export function SignupClient({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; message?: string };
}) {
  const [state, signupAction, pending] = useActionState<AuthState, FormData>(
    signUpWithCredentials,
    null,
  );
  const [discordState, discordAction, discordPending] = useActionState<
    AuthState,
    FormData
  >(signUpWithDiscord, null);

  return (
    <SignupForm
      error={state?.error}
      discordError={discordState?.error}
      message={searchParams?.message}
      signupAction={signupAction}
      discordAction={discordAction}
      redirectTo={searchParams?.redirectTo}
      pending={pending}
      discordPending={discordPending}
    />
  );
}
