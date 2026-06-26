import { getCurrentUser } from "@/lib/auth/current-user";

import { verifyUserPermissions, type PermissionState } from "./auth-guards";

/**
 * Server helper that reuses the per-request cached current user (see `getCurrentUser`).
 */
export async function verifyCurrentUserPermissions(
  targetTeamId?: string,
): Promise<PermissionState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { authorized: false };
  }

  return verifyUserPermissions(currentUser, targetTeamId);
}
