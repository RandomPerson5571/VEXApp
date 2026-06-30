"use server";

import { redirect } from "next/navigation";

import { getPasswordResetRedirectUrl } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetState =
  | { error: string }
  | { success: string }
  | null;

function getEmailFromForm(formData: FormData): string | null {
  const email = formData.get("email");

  if (typeof email !== "string") {
    return null;
  }

  const trimmed = email.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function requestPasswordReset(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emailFromForm = getEmailFromForm(formData);
  const email = user?.email ?? emailFromForm;

  if (!email) {
    return { error: "Enter the email address for your account." };
  }

  if (user?.email && emailFromForm && emailFromForm !== user.email) {
    return {
      error: "Reset links can only be sent to your signed-in email address.",
    };
  }

  const redirectTo = await getPasswordResetRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function updatePassword(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    !password ||
    !confirmPassword
  ) {
    return { error: "Enter and confirm your new password." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Your reset session expired. Request a new password reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/settings/profile?message=password_updated");
}
