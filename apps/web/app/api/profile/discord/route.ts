import { NextResponse } from "next/server";

import { syncDiscordIdToProfile, resolveAuthUserWithIdentities } from "@/lib/auth/identity";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const limited = await enforceApiRateLimit(request, user.id, "integrations");
  if (limited) return limited;

  const result = await syncDiscordIdToProfile(
    await resolveAuthUserWithIdentities(supabase, user),
  );

  if (!result.ok) {
    const status =
      result.code === "conflict"
        ? 409
        : result.code === "not_linked"
          ? 400
          : 400;

    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ message: "Discord account linked." });
}
