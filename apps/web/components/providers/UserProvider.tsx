"use client";

import type { User as AuthUser } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

import type { Team, User } from "@stlvex/database/types";

export type UserContextValue = {
  authUser: AuthUser;
  profile: User;
  team: Team | null;
};

const UserContext = createContext<UserContextValue | null>(null);

/**
 * Provides the authenticated user resolved once on the server (via
 * `getCurrentUserState`) to client components. Prefer these hooks over calling
 * `supabase.auth.getUser()` in the browser.
 */
export function UserProvider({
  value,
  children,
}: {
  value: UserContextValue;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}

export function useOptionalUser(): UserContextValue | null {
  return useContext(UserContext);
}

/** Supabase auth user — use instead of `supabase.auth.getUser()` in client UI. */
export function useAuthUser(): AuthUser {
  return useUser().authUser;
}

/** Database profile for the signed-in user. */
export function useProfile(): User {
  return useUser().profile;
}

/** Team assigned to the signed-in user, if any. */
export function useTeam(): Team | null {
  return useUser().team;
}
