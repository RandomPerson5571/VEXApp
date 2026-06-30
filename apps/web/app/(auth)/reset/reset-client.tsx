"use client";

import { useActionState } from "react";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import {
  requestPasswordReset,
  type PasswordResetState,
} from "@/app/(auth)/actions/password";

export function ResetClient({ initialError }: { initialError?: string | null }) {
  const [state, resetAction, pending] = useActionState<
    PasswordResetState,
    FormData
  >(requestPasswordReset, null);

  return (
    <ForgotPasswordForm
      error={
        (state && "error" in state ? state.error : null) ?? initialError ?? null
      }
      success={state && "success" in state ? state.success : null}
      resetAction={resetAction}
      pending={pending}
    />
  );
}
