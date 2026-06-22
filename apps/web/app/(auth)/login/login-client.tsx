"use client";

import { useActionState } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import {
  signInWithCredentials,
  type LoginState,
} from "@/app/(auth)/actions/auth";

export function LoginClient() {
  const [state, loginAction, pending] = useActionState<LoginState, FormData>(
    signInWithCredentials,
    null,
  );

  return (
    <LoginForm
      error={state?.error}
      loginAction={loginAction}
      pending={pending}
    />
  );
}
