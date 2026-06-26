"use client";

import { useUser } from "@/components/providers/UserProvider";
import {
  verifyUserPermissions,
  type PermissionState,
} from "@/lib/auth/auth-guards";

export function useUserPermissions(targetTeamId?: string): PermissionState {
  const user = useUser();
  return verifyUserPermissions(user, targetTeamId);
}
