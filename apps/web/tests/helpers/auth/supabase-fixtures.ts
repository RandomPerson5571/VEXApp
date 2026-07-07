import type { User as SupabaseUser } from "@supabase/supabase-js";
import { vi } from "vitest";

export const DEFAULT_SUPABASE_USER_ID = "22222222-2222-2222-2222-222222222222";

export function buildAuthUser(
  overrides: Partial<SupabaseUser> = {},
): SupabaseUser {
  const id =
    typeof overrides.id === "string" ? overrides.id : DEFAULT_SUPABASE_USER_ID;

  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "user@example.com",
    app_metadata: { provider: "email" },
    user_metadata: { sub: id },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    ...overrides,
  } as SupabaseUser;
}

type MockSupabaseClientOptions = {
  getUser?: ReturnType<typeof vi.fn>;
  exchangeCodeForSession?: ReturnType<typeof vi.fn>;
  signOut?: ReturnType<typeof vi.fn>;
  getUserIdentities?: ReturnType<typeof vi.fn>;
};

export function mockSupabaseClient(options: MockSupabaseClientOptions = {}) {
  return {
    auth: {
      getUser:
        options.getUser ??
        vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      exchangeCodeForSession:
        options.exchangeCodeForSession ??
        vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: options.signOut ?? vi.fn().mockResolvedValue({ error: null }),
      getUserIdentities:
        options.getUserIdentities ??
        vi.fn().mockResolvedValue({ data: { identities: [] }, error: null }),
    },
  };
}
