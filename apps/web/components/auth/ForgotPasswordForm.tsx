"use client";

import Link from "next/link";
import { Mail, ShieldAlert } from "lucide-react";

import STLRoboticsLogoComponent from "../Logo";

export type ForgotPasswordFormProps = {
  error?: string | null;
  success?: string | null;
  resetAction: (formData: FormData) => void;
  pending?: boolean;
};

export function ForgotPasswordForm({
  error,
  success,
  resetAction,
  pending = false,
}: ForgotPasswordFormProps) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 backdrop-blur-md relative">
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <STLRoboticsLogoComponent width={100} height={100} />
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">
          Reset your password
        </h2>
        <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
          Enter your account email and we&apos;ll send a secure link to choose a
          new password.
        </p>
      </div>

      {error ? (
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span className="font-semibold leading-snug">{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span className="font-semibold leading-snug">{success}</span>
        </div>
      ) : null}

      <form action={resetAction} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[11px] font-bold text-slate-400 tracking-wide uppercase"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@team.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900/60 text-slate-200 text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || Boolean(success)}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-xs tracking-wide text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] cursor-pointer"
        >
          {pending ? "Sending reset link..." : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-[11px] text-blue-500 hover:underline font-bold"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
