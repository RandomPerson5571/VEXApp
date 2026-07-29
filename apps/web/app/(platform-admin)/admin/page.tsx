import { prisma } from "@stlvex/database";

import { AdminUserPermissionsTable } from "@/components/admin/AdminUserPermissionsTable";
import type { AdminUserRow } from "@/components/admin/admin-types";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const [rawUsers, teams, invites] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isAdmin: true,
        teamId: true,
        suppressedUntil: true,
        bannedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            number: true,
          },
        },
        moderationEventsAsTarget: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { reason: true },
        },
      },
    }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        number: true,
        discordServerId: true,
        discordRoleId: true,
      },
      orderBy: [{ name: "asc" }, { number: "asc" }],
    }),
    prisma.invite.findMany({
      select: {
        id: true,
        teamId: true,
        maxUses: true,
        usesCount: true,
        expiresAt: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            number: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const users: AdminUserRow[] = rawUsers.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
    teamId: user.teamId,
    team: user.team,
    suppressedUntil: user.suppressedUntil?.toISOString() ?? null,
    bannedAt: user.bannedAt?.toISOString() ?? null,
    moderationReason: user.moderationEventsAsTarget[0]?.reason ?? null,
  }));

  return (
    <div className="admin-scroll flex-1 overflow-y-auto overflow-x-hidden px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          Platform administration
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Manage ecosystem-wide permissions for all application users.
        </p>
      </div>

      <AdminUserPermissionsTable
        users={users}
        teams={teams}
        invites={invites.map((invite) => ({
          ...invite,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
        }))}
        currentUserId={currentUser.profile.id}
      />
    </div>
  );
}
