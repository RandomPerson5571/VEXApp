import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import { uploadInventoryImageServer } from "@/lib/supabase/inventory-images.server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to upload inventory images." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = await uploadInventoryImageServer(
      supabase,
      file.name,
      file.type,
      bytes,
    );

    return NextResponse.json({ path });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
