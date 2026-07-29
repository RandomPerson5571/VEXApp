import { NextResponse } from "next/server";

import { canManageTeamRoster } from "@/lib/auth/auth-guards";
import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rejectIfSuppressed } from "@/lib/auth/reject-if-suppressed";
import { orderPlacedTeamInventoryItem } from "@/lib/queries/inventory.server";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const gated = await rejectIfSuppressed();
  if (!gated.ok) return gated.response;

  const currentUser = gated.user;
  const teamId = currentUser.profile.teamId;

  if (!teamId) {
    return NextResponse.json(
      { error: "You must belong to a team." },
      { status: 400 },
    );
  }

  const permissions = await verifyCurrentUserPermissions(teamId);
  if (!canManageTeamRoster(permissions) && !currentUser.profile.isAdmin) {
    return NextResponse.json(
      { error: "Only team leaders or admins can mark Order Placed." },
      { status: 403 },
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
    return NextResponse.json({ error: "Item id is required." }, { status: 400 });
  }

  try {
    const item = await orderPlacedTeamInventoryItem(itemId);
    return NextResponse.json(item);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark order placed.";
    const status = message === "Inventory item not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
