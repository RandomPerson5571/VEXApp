"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";

import {
  resendSignupConfirmation,
  signUpWithDiscord,
  signUpWithCredentials,
  type AuthState,
  type ResendConfirmationState,
} from "@/app/(auth)/actions/auth";
import { SignupForm } from "@/components/auth/SignupForm";
import { completeOnboarding, type OnboardingState } from "./actions";

type OnboardingClientProps = {
  teamName: string;
  teamNumber: string;
  step: "verify" | "profile";
  authEmail?: string;
  redirectTo: string;
  needsEmailConfirmation: boolean;
  message?: string;
  pendingEmail?: string;
};

export function OnboardingClient({
  teamName,
  teamNumber,
  step,
  authEmail,
  redirectTo,
  needsEmailConfirmation,
  message,
  pendingEmail,
}: OnboardingClientProps) {
  const [signupState, signupAction, signupPending] = useActionState<
    AuthState,
    FormData
  >(signUpWithCredentials, null);
  const [discordState, discordAction, discordPending] = useActionState<
    AuthState,
    FormData
  >(signUpWithDiscord, null);
  const [resendState, resendAction, resendPending] = useActionState<
    ResendConfirmationState,
    FormData
  >(resendSignupConfirmation, null);
  const [profileState, profileAction, profilePending] = useActionState<
    OnboardingState,
    FormData
  >(completeOnboarding, null);

  const showResendConfirmation = Boolean(message) || needsEmailConfirmation;
  const resendEmail = authEmail ?? pendingEmail;

  if (step === "verify") {
    return (
      <SignupForm
        error={signupState?.error}
        discordError={discordState?.error}
        message={message}
        signupAction={signupAction}
        discordAction={discordAction}
        redirectTo={redirectTo}
        pending={signupPending}
        discordPending={discordPending}
        defaultEmail={pendingEmail}
        resendAction={resendAction}
        resendError={resendState && "error" in resendState ? resendState.error : null}
        resendSuccess={
          resendState && "success" in resendState ? resendState.success : null
        }
        resendPending={resendPending}
        showResendConfirmation={showResendConfirmation}
      />
    );
  }

  if (needsEmailConfirmation) {
    return (
      <div className="w-full max-w-lg rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-950/40 border border-blue-900/40">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            We sent a confirmation link
            {authEmail ? (
              <>
                {" "}
                to <span className="text-slate-200 font-semibold">{authEmail}</span>
              </>
            ) : null}
            . Click the link in that email to verify your account, then return
            here to finish joining the team.
          </p>
        </div>

        {resendState && "error" in resendState ? (
          <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-300 text-left">
            {resendState.error}
          </div>
        ) : null}

        {resendState && "success" in resendState ? (
          <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300 text-left">
            {resendState.success}
          </div>
        ) : null}

        <form action={resendAction} className="space-y-3 text-left">
          {resendEmail ? (
            <input type="hidden" name="email" value={resendEmail} />
          ) : null}
          <button
            type="submit"
            disabled={resendPending || Boolean(resendState && "success" in resendState)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            {resendPending ? "Sending..." : "Resend confirmation email"}
          </button>
        </form>

        <p className="text-xs text-slate-500">
          Joining {teamName} ({teamNumber})
        </p>
      </div>
    );
  }

  return (
    <form
      action={profileAction}
      className="w-full max-w-lg rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 space-y-5"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
          Joining {teamName} ({teamNumber})
        </p>
        <h1 className="text-2xl font-bold text-white mt-2">Finish onboarding</h1>
        <p className="text-sm text-slate-400 mt-1">
          Confirm your name so we can create your dashboard profile.
        </p>
      </div>

      {profileState?.error ? (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {profileState.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            First name
          </span>
          <input
            name="firstName"
            type="text"
            className="rounded-lg border border-slate-900/60 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Last name
          </span>
          <input
            name="lastName"
            type="text"
            className="rounded-lg border border-slate-900/60 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={profilePending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {profilePending ? "Creating profile..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
