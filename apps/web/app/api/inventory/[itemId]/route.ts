import { NextResponse } from "next/server";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import {
  deleteTeamInventoryItem,
  updateTeamInventoryItem,
} from "@/lib/queries/inventory.server";

type UpdateInventoryItemRequestBody = {
  name?: string;
  description?: string;
  totalStock?: number;
  checkoutLimit?: number | null;
  imageUrl?: string | null;
};

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

  const { itemId } = await context.params;

  if (!itemId?.trim()) {
    return NextResponse.json({ error: "Item id is required." }, { status: 400 });
  }

  let body: UpdateInventoryItemRequestBody;

  try {
    body = (await request.json()) as UpdateInventoryItemRequestBody;
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
    const item = await updateTeamInventoryItem({
      itemId,
      name,
      description: body.description ?? null,
      totalStock,
      checkoutLimit,
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
    });

    return NextResponse.json(item);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update inventory item.";
    const status = message === "Inventory item not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

  const { itemId } = await context.params;

  if (!itemId?.trim()) {
    return NextResponse.json({ error: "Item id is required." }, { status: 400 });
  }

  try {
    await deleteTeamInventoryItem(itemId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete inventory item.";
    const status = message === "Inventory item not found." ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
