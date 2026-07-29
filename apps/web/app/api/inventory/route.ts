import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import {
  createTeamInventoryItem,
  getTeamInventory,
} from "@/lib/queries/inventory.server";

type CreateInventoryItemRequestBody = {
  name?: string;
  description?: string;
  totalStock?: number;
  checkoutLimit?: number | null;
  imageUrl?: string;
};

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!currentUser.profile.teamId) {
    return NextResponse.json([]);
  }

  const inventory = await getTeamInventory(currentUser.profile.teamId);
  return NextResponse.json(inventory);
}

export async function POST(request: Request) {
  const permissions = await verifyCurrentUserPermissions();

  if (!permissions.authorized || permissions.scope !== "GLOBAL") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  if (limited) return limited;

  let body: CreateInventoryItemRequestBody;

  try {
    body = (await request.json()) as CreateInventoryItemRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const totalStock = body.totalStock;

  if (totalStock === undefined || !Number.isInteger(totalStock)) {
    return NextResponse.json(
      { error: "Total stock must be a whole number." },
      { status: 400 },
    );
  }

  const checkoutLimit = body.checkoutLimit ?? null;

  if (
    checkoutLimit !== null &&
    (!Number.isInteger(checkoutLimit) || checkoutLimit < 1)
  ) {
    return NextResponse.json(
      { error: "Checkout limit must be a whole number of at least 1." },
      { status: 400 },
    );
  }

  try {
    const item = await createTeamInventoryItem({
      name,
      description: body.description ?? null,
      totalStock,
      checkoutLimit,
      imageUrl: body.imageUrl ?? null,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create inventory item.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
