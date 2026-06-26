import type { User } from "@supabase/supabase-js";

import { getAuthUser } from "@/lib/auth/session";

export type { User as SessionUser };

export async function getUser(): Promise<User | null> {
  return getAuthUser();
}
