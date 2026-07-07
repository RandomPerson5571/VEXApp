"use client";

import { useMemo, useState } from "react";
import { Building2, Users } from "lucide-react";

import { AdminTeamManagementTable } from "./AdminTeamManagementTable";
import { AdminUserManagementTable } from "./AdminUserManagementTable";
import {
  AdminErrorAlert,
  AdminTabSwitcher,
} from "./AdminPanelPrimitives";
import {
  sortTeams,
  sortUsersByTeam,
  toTeamOption,
  type AdminTeamRow,
  type AdminUserRow,
} from "./admin-types";

export type {
  AdminTeamOption,
  AdminTeamRow,
  AdminUserRow,
} from "./admin-types";

type AdminUserPermissionsTableProps = {
  users: AdminUserRow[];
  teams: AdminTeamRow[];
  currentUserId: string;
};

type AdminTab = "users" | "teams";

const ADMIN_TABS = [
  { id: "users" as const, label: "Users", icon: Users },
  { id: "teams" as const, label: "Teams", icon: Building2 },
];

export function AdminUserPermissionsTable({
  users: initialUsers,
  teams: initialTeams,
  currentUserId,
}: AdminUserPermissionsTableProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [teams, setTeams] = useState(() => sortTeams(initialTeams));
  const [error, setError] = useState<string | null>(null);

  const teamOptions = useMemo(() => teams.map(toTeamOption), [teams]);

  const tabDescription =
    activeTab === "users"
      ? "Edit user profiles, team assignments, and platform administrator access."
      : "Create teams, manage identity settings, and remove teams when needed.";

  function handleTabChange(tab: AdminTab) {
    setError(null);
    setActiveTab(tab);
  }

  function handleTeamUpdated(updatedTeam: AdminTeamRow) {
    const option = toTeamOption(updatedTeam);

    setTeams((current) =>
      sortTeams(
        current.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)),
      ),
    );

    setUsers((current) =>
      sortUsersByTeam(
        current.map((user) =>
          user.teamId === updatedTeam.id ? { ...user, team: option } : user,
        ),
      ),
    );
  }

  function handleTeamCreated(team: AdminTeamRow) {
    setTeams((current) => sortTeams([...current, team]));
  }

  function handleTeamsDeleted(teamIds: string[]) {
    const deleted = new Set(teamIds);

    setTeams((current) => current.filter((team) => !deleted.has(team.id)));
    setUsers((current) =>
      sortUsersByTeam(
        current.map((user) =>
          user.teamId && deleted.has(user.teamId)
            ? { ...user, teamId: null, team: null }
            : user,
        ),
      ),
    );
  }

  return (
    <section className="relative rounded-2xl border border-slate-800/80 bg-[#090e18]/80 p-6 shadow-lg shadow-black/20 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/35 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mb-5 flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-black uppercase tracking-widest text-slate-500">
            Control plane
          </p>
          <h2 className="mt-1 text-sm font-black uppercase tracking-wide text-slate-200">
            Platform administration
          </h2>
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-slate-500">
            {tabDescription}
          </p>
        </div>

        <AdminTabSwitcher
          tabs={ADMIN_TABS}
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {error ? (
        <AdminErrorAlert message={error} onDismiss={() => setError(null)} />
      ) : null}

      <div
        key={activeTab}
        className="relative motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-reduce:animate-none"
      >
        {activeTab === "users" ? (
          <AdminUserManagementTable
            users={users}
            teamOptions={teamOptions}
            currentUserId={currentUserId}
            onUsersChange={setUsers}
            onError={setError}
          />
        ) : (
          <AdminTeamManagementTable
            teams={teams}
            onTeamCreated={handleTeamCreated}
            onTeamUpdated={handleTeamUpdated}
            onTeamsDeleted={handleTeamsDeleted}
            onError={setError}
          />
        )}
      </div>
    </section>
  );
}
