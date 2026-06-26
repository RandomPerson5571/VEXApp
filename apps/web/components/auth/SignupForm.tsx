"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, UserPlus } from "lucide-react";

import STLRoboticsLogoComponent from "../Logo";
export type SignupFormProps = {
  error?: string | null;
  message?: string | null;
  signupAction: (formData: FormData) => void;
  discordAction: (formData: FormData) => void;
  redirectTo?: string;
  pending?: boolean;
  discordPending?: boolean;
  discordError?: string | null;
};

export function SignupForm({
  error,
  message,
  signupAction,
  discordAction,
  redirectTo,
  pending = false,
  discordPending = false,
  discordError,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const activeError = error ?? discordError;

  return (
    <div className="w-full max-w-md rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 backdrop-blur-md relative">
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <STLRoboticsLogoComponent width={100} height={100} />
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">
          Create your account
        </h2>
        <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
          Join the team portal to manage events, documents, and robotics
          updates.
        </p>
      </div>

      {activeError && (
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span className="font-semibold leading-snug">{activeError}</span>
        </div>
      )}

      {message && !activeError && (
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span className="font-semibold leading-snug">{message}</span>
        </div>
      )}

      <form action={signupAction} className="space-y-5">
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}

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
              required
              placeholder="name@team.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900/60 text-slate-200 text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-[11px] font-bold text-slate-400 tracking-wide uppercase"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Create a password"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-900/60 text-slate-200 text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-[11px] font-bold text-slate-400 tracking-wide uppercase"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <UserPlus className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Confirm your password"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-900/60 text-slate-200 text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || discordPending}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-xs tracking-wide text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] cursor-pointer"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#090e18] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            or
          </span>
        </div>
      </div>

      <form action={discordAction}>
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
        <button
          type="submit"
          disabled={pending || discordPending}
          className="w-full py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 disabled:cursor-not-allowed font-bold text-xs tracking-wide text-white transition-all shadow-[0_0_24px_rgba(88,101,242,0.35)] hover:shadow-[0_0_28px_rgba(88,101,242,0.5)] cursor-pointer"
        >
          {discordPending ? "Redirecting to Discord..." : "Continue with Discord"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-[11px] text-slate-500 font-semibold">
          Already have an account?{" "}
          <Link
            href={
              redirectTo
                ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
                : "/login"
            }
            className="text-blue-500 hover:underline font-bold"
          >
            Log in
          </Link>
        </span>
      </div>
    </div>
  );
}
