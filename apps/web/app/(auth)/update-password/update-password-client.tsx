"use client";

import { useActionState } from "react";

import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import {
  updatePassword,
  type PasswordResetState,
} from "@/app/(auth)/actions/password";

export function UpdatePasswordClient() {
  const [state, updateAction, pending] = useActionState<
    PasswordResetState,
    FormData
  >(updatePassword, null);

  return (
    <UpdatePasswordForm
      error={state && "error" in state ? state.error : null}
      updateAction={updateAction}
      pending={pending}
    />
  );
}
