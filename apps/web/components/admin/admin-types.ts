import type { UserRole } from "@stlvex/database/types";

export type AdminTeamRow = {
  id: string;
  name: string;
  number: string;
  discordServerId: string | null;
  discordRoleId: string | null;
};

export type AdminTeamOption = Pick<AdminTeamRow, "id" | "name" | "number">;

export type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  teamId: string | null;
  team: AdminTeamOption | null;
};

export const ADMIN_FIELD_CLASS_NAME =
  "w-full min-w-0 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-100 outline-none transition focus:border-orange-500/40 disabled:cursor-not-allowed disabled:opacity-60";

export function formatRole(role: UserRole): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatTeamLabel(team: AdminTeamOption): string {
  return `${team.number} — ${team.name}`;
}

export function toTeamOption(team: AdminTeamRow): AdminTeamOption {
  return { id: team.id, name: team.name, number: team.number };
}

export function sortUsersByTeam(users: AdminUserRow[]): AdminUserRow[] {
  return [...users].sort((left, right) => {
    const leftTeam = left.team?.name ?? "";
    const rightTeam = right.team?.name ?? "";

    if (!leftTeam && rightTeam) {
      return 1;
    }

    if (leftTeam && !rightTeam) {
      return -1;
    }

    const teamCompare = leftTeam.localeCompare(rightTeam, undefined, {
      sensitivity: "base",
    });

    if (teamCompare !== 0) {
      return teamCompare;
    }

    const lastNameCompare = left.lastName.localeCompare(right.lastName, undefined, {
      sensitivity: "base",
    });

    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    return left.firstName.localeCompare(right.firstName, undefined, {
      sensitivity: "base",
    });
  });
}

export function sortTeams(teams: AdminTeamRow[]): AdminTeamRow[] {
  return [...teams].sort((left, right) => {
    const nameCompare = left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.number.localeCompare(right.number, undefined, {
      sensitivity: "base",
    });
  });
}
