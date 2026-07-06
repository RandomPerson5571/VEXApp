import type { Metadata } from "next";
import Link from "next/link";

import {
  clearInviteCookie,
  getInviteCodeFromCookies,
  getInviteFailureReason,
  type InviteJoinFailureReason,
} from "@/lib/auth/invite";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  index: false,
  path: "/invite-invalid",
});

type InviteInvalidPageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

const INVITE_INVALID_COPY: Record<
  InviteJoinFailureReason,
  { title: string; description: string }
> = {
  not_found: {
    title: "Invite not found",
    description:
      "This invite link is invalid. Double-check the URL or ask your team lead for a new one.",
  },
  expired: {
    title: "Invite expired",
    description:
      "This invite link has expired. Ask your team lead to send a fresh invite.",
  },
  exhausted: {
    title: "Invite fully used",
    description:
      "This invite has already been used the maximum number of times. Request a new invite from your team.",
  },
  reserved: {
    title: "Invite in use",
    description:
      "Someone else is currently completing signup with this invite. Try again later or ask for a new link.",
  },
};

function parseReasonParam(
  reason: string | undefined,
): InviteJoinFailureReason | null {
  if (
    reason === "not_found" ||
    reason === "expired" ||
    reason === "exhausted" ||
    reason === "reserved"
  ) {
    return reason;
  }

  return null;
}

export default async function InviteInvalidPage({
  searchParams,
}: InviteInvalidPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const reasonParam = parseReasonParam(resolvedSearchParams?.reason);
  const cookieCode = await getInviteCodeFromCookies();
  const reason =
    reasonParam ??
    (cookieCode ? await getInviteFailureReason(cookieCode) : "not_found");

  await clearInviteCookie();

  const copy = INVITE_INVALID_COPY[reason];

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#090e18]/80 border border-slate-900 shadow-2xl p-8 text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white">{copy.title}</h1>
          <p className="text-sm text-slate-400">{copy.description}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left space-y-3">
          <p className="text-sm font-medium text-slate-200">
            Already started signing up?
          </p>
          <p className="text-sm text-slate-400">
            Your account may still exist even if this invite link no longer
            works. Try signing in with the email or Discord account you used
            during signup.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-semibold text-blue-500 hover:underline"
          >
            Sign in to your account
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Need help? Ask your team lead for a new invite, or contact your
          organization&apos;s support contact if you cannot access your
          account.
        </p>
      </div>
    </div>
  );
}
