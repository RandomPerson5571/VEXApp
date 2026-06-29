"use client";

import { useActionState } from "react";

import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingClient() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    null,
  );

  return (
    <form action={action} className="w-full max-w-lg rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Finish onboarding</h1>
        <p className="text-sm text-slate-400 mt-1">
          Confirm your name so we can create your dashboard profile.
        </p>
      </div>

      {state?.error ? (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">First name</span>
          <input
            name="firstName"
            type="text"
            className="rounded-lg border border-slate-900/60 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</span>
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
        disabled={pending}
        className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating profile..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
