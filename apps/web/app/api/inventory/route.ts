import { NextResponse } from "next/server";
import { appendFileSync } from "node:fs";

import { verifyCurrentUserPermissions } from "@/lib/auth/auth-guards-server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { enforceApiRateLimit } from "@/lib/security/enforce-api-rate-limit";
import {
  createTeamInventoryItem,
  getTeamInventory,
} from "@/lib/queries/inventory.server";

// #region agent log
function agentLog(payload: Record<string, unknown>) {
  const body = { sessionId: "d8eb0f", timestamp: Date.now(), ...payload };
  fetch("http://127.0.0.1:7606/ingest/94402233-073f-41fc-9f2f-345a912c7139", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d8eb0f",
    },
    body: JSON.stringify(body),
  }).catch(() => {});
  try {
    appendFileSync(
      "c:/Users/griff/OneDrive/Documents/coding-workspace/VexRobotics/VEXApp/debug-d8eb0f.log",
      `${JSON.stringify(body)}\n`,
    );
  } catch {
    /* ignore */
  }
}
// #endregion

type CreateInventoryItemRequestBody = {
  name?: string;
  description?: string;
  totalStock?: number;
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

  // #region agent log
  agentLog({
    runId: "post-fix",
    hypothesisId: "H-A",
    location: "inventory/route.ts:POST:permissions",
    message: "inventory POST after permissions",
    data: {
      authorized: permissions.authorized,
      scope: "scope" in permissions ? permissions.scope : null,
      hasRequest: !!request,
    },
  });
  // #endregion

  if (!permissions.authorized || permissions.scope !== "GLOBAL") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const currentUser = await getCurrentUser();

  // #region agent log
  agentLog({
    runId: "post-fix",
    hypothesisId: "H-A",
    location: "inventory/route.ts:POST:currentUser",
    message: "inventory POST getCurrentUser result",
    data: {
      hasCurrentUser: !!currentUser,
      userId: currentUser?.profile?.id ?? null,
    },
  });
  // #endregion

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const limited = await enforceApiRateLimit(
    request,
    currentUser.profile.id,
    "team",
  );
  // #region agent log
  agentLog({
    runId: "post-fix",
    hypothesisId: "H-B",
    location: "inventory/route.ts:POST:rateLimit",
    message: "inventory POST after rate limit",
    data: { wasLimited: !!limited, limitedStatus: limited?.status ?? null },
  });
  // #endregion
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

  try {
    const item = await createTeamInventoryItem({
      name,
      description: body.description ?? null,
      totalStock,
      imageUrl: body.imageUrl ?? null,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create inventory item.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
