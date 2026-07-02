import type { UserContextValue } from "@/components/providers/UserProvider";
import type { User, UserRole } from "@stlvex/database/types";

export type TeamRole = "TEAM_LEADER" | "MEMBER";
export type GlobalPermission = {
  authorized: true;
  scope: "GLOBAL";
};

export type TeamPermission = {
  authorized: true;
  scope: "TEAM";
  teamId: string;
  role: TeamRole;
};

export type DeniedPermission = {
  authorized: false;
};

export type PermissionState =
  | GlobalPermission
  | TeamPermission
  | DeniedPermission;

export type PermissionUserContext =
  | UserContextValue
  | { profile: PermissionProfile };
type PermissionProfile = Pick<User, "isAdmin" | "teamId" | "role">;

function toTeamRole(role: UserRole): TeamRole {
  if (role === "TEAM_LEADER" || role === "ADMIN") {
    return "TEAM_LEADER";
  }

  return "MEMBER";
}

export function isGlobalAdmin(user: PermissionUserContext): boolean {
  const permissions = verifyUserPermissions(user);
  return permissions.authorized && permissions.scope === "GLOBAL";
}

/**
 * Pure permission resolver. Pass an already-loaded user context — no database fetch.
 */
export function verifyUserPermissions(
  user: PermissionUserContext,
  targetTeamId?: string,
): PermissionState {
  return resolveUserPermissions(user.profile, targetTeamId);
}

function resolveUserPermissions(
  profile: PermissionProfile,
  targetTeamId?: string,
): PermissionState {
  if (profile.isAdmin) {
    return { authorized: true, scope: "GLOBAL" };
  }

  if (!targetTeamId) {
    return { authorized: false };
  }

  if (profile.teamId !== targetTeamId) {
    return { authorized: false };
  }

  return {
    authorized: true,
    scope: "TEAM",
    teamId: targetTeamId,
    role: toTeamRole(profile.role),
  };
}

/**
 * Team management requires an assigned team, including for platform administrators.
 */
export function canAccessTeamManagement(user: PermissionUserContext): boolean {
  return Boolean(user.profile.teamId);
}

/**
 * Any non-admin user assigned to the target team may view its roster.
 */
export function canViewTeamRoster(permissions: PermissionState): boolean {
  return permissions.authorized && permissions.scope === "TEAM";
}

/**
 * Team leaders (and platform admins) may add, remove, or update roster entries
 * within their own team.
 */
export function canManageTeamRoster(permissions: PermissionState): boolean {
  if (!permissions.authorized) {
    return false;
  }

  if (permissions.scope === "GLOBAL") {
    return true;
  }

  return permissions.role === "TEAM_LEADER";
}

/**
 * Any same-team member (or global admin) may connect or manage GitHub integrations.
 */
export function canManageTeamIntegrations(
  permissions: PermissionState,
): boolean {
  if (!permissions.authorized) {
    return false;
  }

  return permissions.scope === "TEAM" || permissions.scope === "GLOBAL";
}

/**
 * Whether the user may promote members to team leader within a team.
 * Global admins bypass team boundaries; team leaders may delegate locally.
 */
export function canDelegateTeamLeaders(permissions: PermissionState): boolean {
  if (!permissions.authorized) {
    return false;
  }

  if (permissions.scope === "GLOBAL") {
    return true;
  }

  return permissions.role === "TEAM_LEADER";
}

/**
 * Whether the user may create invite links.
 * Global admins may invite to any team; team leaders only to their own.
 */
export function canCreateInvites(permissions: PermissionState): boolean {
  return canDelegateTeamLeaders(permissions);
}
