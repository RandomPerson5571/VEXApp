import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { returnTeamInventorySignOut } from "@/lib/queries/inventory.server";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type RouteContext = {
  params: Promise<{ itemId: string; signOutId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to return inventory." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { itemId, signOutId } = await context.params;

  if (!itemId?.trim() || !signOutId?.trim()) {
    return NextResponse.json(
      { error: "Inventory item id and sign-out id are required." },
      { status: 400 },
    );
  }

  try {
    const item = await returnTeamInventorySignOut({
      inventoryItemId: itemId,
      signOutId,
      teamId,
    });

    return NextResponse.json(item);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to return inventory item.";
    const status = message === "Active sign-out not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
