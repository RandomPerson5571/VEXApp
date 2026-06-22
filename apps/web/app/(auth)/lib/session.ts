import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type { User as SessionUser };

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
