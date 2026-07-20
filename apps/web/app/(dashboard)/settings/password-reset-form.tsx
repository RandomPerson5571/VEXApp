"use client";

import { useActionState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";

import {
  requestPasswordReset,
  type PasswordResetState,
} from "@/app/(auth)/actions/password";

type PasswordResetFormProps = {
  email: string;
};

export function PasswordResetForm({ email }: PasswordResetFormProps) {
  const [state, action, pending] = useActionState<
    PasswordResetState,
    FormData
  >(requestPasswordReset, null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Password</p>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Request a secure password reset link sent to{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-400">{email}</span>.
          </p>
        </div>

        <form action={action} className="shrink-0">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={pending || Boolean(state && "success" in state)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-[#121212]/60 dark:text-slate-200 dark:hover:text-blue-200"
          >
            <KeyRound className="h-4 w-4" />
            {pending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>

      {state && "error" in state ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
          {state.error}
        </div>
      ) : null}

      {state && "success" in state ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-600 dark:text-emerald-300">{state.success}</p>
        </div>
      ) : null}
    </div>
  );
}
