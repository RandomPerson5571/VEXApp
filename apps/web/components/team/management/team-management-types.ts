import type { UserRole } from "@stlvex/database/types";

import { formatRole } from "@/components/admin/admin-types";

export type MemberStatus = "Active" | "Inactive";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: MemberStatus;
};

export const TEAM_ROSTER_USER_ROLES: UserRole[] = [
  "TEAM_LEADER",
  "TEAM_MEMBER",
];

export const TEAM_SEASON_OPTIONS = [
  "2024-2025 VEX V5 Competition",
  "2023-2024 Over Under Exhibition",
] as const;

type RosterUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
};

export function toTeamMember(user: RosterUser): TeamMember {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    status: "Active",
  };
}

export function formatTeamMemberRole(role: UserRole): string {
  return formatRole(role);
}

export const TEAM_FIELD_CLASS_NAME =
  "w-full rounded-lg border border-[#1a1a1a] bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-slate-800 focus:outline-none";

export const TEAM_INLINE_SELECT_CLASS_NAME =
  "rounded-lg border border-[#1a1a1a] bg-slate-950 px-2 py-1 text-[11.5px] font-semibold text-slate-200 focus:outline-none";
