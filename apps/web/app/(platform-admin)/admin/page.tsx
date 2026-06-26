import { prisma } from "@stlvex/database";

import { AdminUserPermissionsTable } from "@/components/admin/AdminUserPermissionsTable";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isAdmin: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true,
            number: true,
          },
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
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
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
        currentUserId={currentUser.profile.id}
      />
    </div>
  );
}
