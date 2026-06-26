"use client";

import { useActionState } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import {
  signInWithDiscord,
  signInWithCredentials,
  type AuthState,
} from "@/app/(auth)/actions/auth";

export function LoginClient({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; message?: string; error?: string };
}) {
  const [state, loginAction, pending] = useActionState<AuthState, FormData>(
    signInWithCredentials,
    null,
  );
  const [discordState, discordAction, discordPending] = useActionState<
    AuthState,
    FormData
  >(signInWithDiscord, null);

  return (
    <LoginForm
      error={state?.error ?? searchParams?.error}
      discordError={discordState?.error}
      message={searchParams?.message}
      loginAction={loginAction}
      discordAction={discordAction}
      redirectTo={searchParams?.redirectTo}
      pending={pending}
      discordPending={discordPending}
    />
  );
}
