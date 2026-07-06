import { redirect } from "next/navigation";

import { prisma } from "@stlvex/database";
import { getUser } from "@/app/(auth)/lib/session";
import {
  clearInviteCookie,
  getInviteCodeFromCookies,
  getInviteFailureReason,
  getValidInviteFromCookies,
} from "@/lib/auth/invite";

export default async function SignupPage() {
  const user = await getUser();

  if (user) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    redirect(profile ? "/dashboard" : "/onboarding");
  }

  const invite = await getValidInviteFromCookies();

  if (invite) {
    redirect("/onboarding");
  }

  const code = await getInviteCodeFromCookies();
  await clearInviteCookie();
  const reason = code ? await getInviteFailureReason(code) : "not_found";
  redirect(`/invite-invalid?reason=${reason}`);
}