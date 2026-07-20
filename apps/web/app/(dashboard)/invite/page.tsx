import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { prisma } from "@stlvex/database";

import { InviteCreationView } from "@/components/invite/InviteCreationView";
import {
  canCreateInvites,
  isGlobalAdmin,
  verifyUserPermissions,
} from "@/lib/auth/auth-guards";
import { getCurrentUser } from "@/lib/auth/current-user";

type InviteTeamOption = {
  id: string;
  name: string;
  number: string;
};

function InviteAccessFallback({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <ShieldOff className="h-7 w-7 text-red-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          Access restricted
        </p>
        <h1 className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function InvitePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <InviteAccessFallback
        title="Sign in required"
        description="You must be signed in to create invite links."
      />
    );
  }

  const permissions = verifyUserPermissions(
    currentUser,
    currentUser.team?.id ?? undefined,
  );

  if (!canCreateInvites(permissions)) {
    return (
      <InviteAccessFallback
        title="Access denied"
        description="Only team leaders and platform administrators can create invite links."
      />
    );
  }

  let teams: InviteTeamOption[] = [];

  if (isGlobalAdmin(currentUser)) {
    teams = await prisma.team.findMany({
      select: { id: true, name: true, number: true },
      orderBy: [{ name: "asc" }, { number: "asc" }],
    });
  } else if (currentUser.team) {
    teams = [
      {
        id: currentUser.team.id,
        name: currentUser.team.name,
        number: currentUser.team.number,
      },
    ];
  }

  if (teams.length === 0) {
    return (
      <InviteAccessFallback
        title="No teams available"
        description="There are no teams you can create invite links for right now."
      />
    );
  }

  return (
    <InviteCreationView
      teams={teams}
      lockTeamSelection={!isGlobalAdmin(currentUser)}
    />
  );
}
