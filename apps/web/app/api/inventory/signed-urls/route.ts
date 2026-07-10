import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { resolveInventoryImageUrlsServer } from "@/lib/supabase/inventory-images.server";
import { createClient } from "@/lib/supabase/server";

type SignedUrlsRequestBody = {
  paths?: string[];
};

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to resolve inventory images." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: SignedUrlsRequestBody;

  try {
    body = (await request.json()) as SignedUrlsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const paths = body.paths;

  if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string")) {
    return NextResponse.json(
      { error: "paths must be an array of strings." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const urls = await resolveInventoryImageUrlsServer(supabase, paths);

  return NextResponse.json({ urls });
}
