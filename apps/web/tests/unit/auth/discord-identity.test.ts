import type { User as SupabaseUser } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getDiscordIdFromAuthUser } from "@/lib/auth/identity";

const SUPABASE_USER_ID = "11111111-1111-1111-1111-111111111111";
const DISCORD_SNOWFLAKE = "987654321098765432";

function buildAuthUser(
  overrides: Partial<SupabaseUser> = {},
): SupabaseUser {
  return {
    id: SUPABASE_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "user@example.com",
    app_metadata: { provider: "email" },
    user_metadata: { sub: SUPABASE_USER_ID },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as SupabaseUser;
}

describe("getDiscordIdFromAuthUser", () => {
  it("returns null for email users without a Discord identity", () => {
    const user = buildAuthUser();

    expect(getDiscordIdFromAuthUser(user)).toBeNull();
  });

  it("does not treat Supabase user_metadata.sub as a Discord ID", () => {
    const user = buildAuthUser({
      user_metadata: {
        sub: SUPABASE_USER_ID,
        provider_id: SUPABASE_USER_ID,
      },
    });

    expect(getDiscordIdFromAuthUser(user)).toBeNull();
  });

  it("reads the Discord snowflake from a linked identity", () => {
    const user = buildAuthUser({
      identities: [
        {
          id: DISCORD_SNOWFLAKE,
          provider: "discord",
          identity_data: { sub: DISCORD_SNOWFLAKE },
          user_id: SUPABASE_USER_ID,
          identity_id: DISCORD_SNOWFLAKE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
      ],
    });

    expect(getDiscordIdFromAuthUser(user)).toBe(DISCORD_SNOWFLAKE);
  });

  it("falls back to Discord metadata for Discord-primary sign-in", () => {
    const user = buildAuthUser({
      app_metadata: { provider: "discord" },
      user_metadata: { sub: DISCORD_SNOWFLAKE },
      identities: [],
    });

    expect(getDiscordIdFromAuthUser(user)).toBe(DISCORD_SNOWFLAKE);
  });
});
