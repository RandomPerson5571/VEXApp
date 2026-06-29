"use client";

import { useMemo, useState } from "react";

import { AdminTeamManagementTable } from "./AdminTeamManagementTable";
import { AdminUserManagementTable } from "./AdminUserManagementTable";
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

  return (
    <div className="rounded-2xl border border-slate-900 bg-[#090e18]/80 p-6 shadow-md">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-900 pb-3.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-200">
            Platform administration
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            {activeTab === "users"
              ? "Edit user profiles, team assignments, and platform administrator access."
              : "Create teams and manage team identity and Discord integration settings."}
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-lg border border-slate-900 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-bold transition ${
              activeTab === "users"
                ? "bg-orange-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-bold transition ${
              activeTab === "teams"
                ? "bg-orange-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Teams
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
          {error}
        </p>
      ) : null}

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
          onError={setError}
        />
      )}
    </div>
  );
}
