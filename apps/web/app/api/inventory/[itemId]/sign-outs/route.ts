import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { signOutTeamInventoryItem } from "@/lib/queries/inventory.server";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

type SignOutRequestBody = {
  quantity?: number;
};

export async function POST(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team to sign out inventory." },
      { status: 400 },
    );
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  const { itemId } = await context.params;

  if (!itemId?.trim()) {
    return NextResponse.json(
      { error: "Inventory item id is required." },
      { status: 400 },
    );
  }

  let body: SignOutRequestBody;

  try {
    body = (await request.json()) as SignOutRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const quantity = body.quantity;

  if (!Number.isInteger(quantity) || quantity === undefined || quantity < 1) {
    return NextResponse.json(
      { error: "Quantity must be at least 1." },
      { status: 400 },
    );
  }

  try {
    const item = await signOutTeamInventoryItem({
      inventoryItemId: itemId,
      teamId,
      userId: currentUser.profile.id,
      quantity,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign out inventory item.";
    const status = message === "Inventory item not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
