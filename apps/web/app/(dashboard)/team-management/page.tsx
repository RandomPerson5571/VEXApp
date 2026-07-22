import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { prisma } from "@stlvex/database";

import { TeamManagementView } from "@/components/team/TeamManagementView";
import { toTeamMember } from "@/components/team/management/team-management-types";
import {
  canAccessTeamManagement,
  canManageTeamIntegrations,
  canManageTeamRoster,
  verifyUserPermissions,
} from "@/lib/auth/auth-guards";
import { getCurrentUser } from "@/lib/auth/current-user";

function TeamManagementFallback({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-8 dark:bg-[#000000]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <ShieldOff className="h-7 w-7 text-red-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          Access restricted
        </p>
        <h1 className="mt-2 text-xl font-black text-slate-950 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-500"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function TeamManagementPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <TeamManagementFallback
        title="Sign in required"
        description="You must be signed in to view team management."
      />
    );
  }

  if (!canAccessTeamManagement(currentUser)) {
    return (
      <TeamManagementFallback
        title="No team found"
        description="Please join a team to manage team members."
      />
    );
  }

  const teamId = currentUser.profile.teamId!;

  const permissions = verifyUserPermissions(currentUser, teamId);

  if (!permissions.authorized) {
    return (
      <TeamManagementFallback
        title="Access denied"
        description="You can only view members on your own team."
      />
    );
  }

  const [team, rosterUsers] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      select: {
        name: true,
        number: true,
        githubIntegration: {
          select: {
            id: true,
            repositoryId: true,
            repositoryFullName: true,
            repositoryUrl: true,
            webhookId: true,
            isActive: true,
            installationId: true,
          },
        },
        fusionIntegration: {
          select: {
            id: true,
            projectUrn: true,
            projectName: true,
            hookId: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  if (!team) {
    return (
      <TeamManagementFallback
        title="Team not found"
        description="Your assigned team could not be loaded."
      />
    );
  }

  const canManage = canManageTeamRoster(permissions);
  const canManageIntegrations = canManageTeamIntegrations(permissions);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TeamManagementView
        initialMembers={rosterUsers.map(toTeamMember)}
        initialGithubIntegration={team.githubIntegration}
        initialFusionIntegration={team.fusionIntegration}
        teamLabel={`${team.name} (${team.number})`}
        canManage={canManage}
        canManageIntegrations={canManageIntegrations}
      />
    </div>
  );
}
