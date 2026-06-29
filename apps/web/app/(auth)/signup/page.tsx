import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@stlvex/database";
import { getUser } from "@/app/(auth)/lib/session";
import {
  getValidInviteFromCookies,
  INVITE_REQUIRED_MESSAGE,
} from "@/lib/auth/invite";
import { SignupClient } from "./signup-client";

type SignupPageProps = {
  searchParams?: Promise<{ redirectTo?: string; message?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getUser();
  if (user) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    redirect(profile ? "/dashboard" : "/onboarding");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const invite = await getValidInviteFromCookies();

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Invite required</h1>
          <p className="text-sm text-slate-400">{INVITE_REQUIRED_MESSAGE}</p>
          {resolvedSearchParams?.message ? (
            <p className="text-sm text-amber-300">{resolvedSearchParams.message}</p>
          ) : null}
          <Link
            href="/login"
            className="inline-block text-sm font-semibold text-orange-500 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return <SignupClient searchParams={resolvedSearchParams} />;
}
