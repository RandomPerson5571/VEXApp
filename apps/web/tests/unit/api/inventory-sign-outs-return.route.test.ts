import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const returnTeamInventorySignOutMock = vi.hoisted(() => vi.fn());
const enforceApiRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/queries/inventory.server", () => ({
  returnTeamInventorySignOut: returnTeamInventorySignOutMock,
}));

vi.mock("@/lib/security/enforce-api-rate-limit", () => ({
  enforceApiRateLimit: enforceApiRateLimitMock,
}));

const { PATCH } = await import(
  "@/app/api/inventory/[itemId]/sign-outs/[signOutId]/route"
);

const TEAM_ID = "team-abc";
const USER_ID = "user-abc";

function routeContext(itemId = "item-1", signOutId = "signout-1") {
  return {
    params: Promise.resolve({ itemId, signOutId }),
  };
}

describe("api/inventory/[itemId]/sign-outs/[signOutId] PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceApiRateLimitMock.mockResolvedValue(null);
  });

  it("returns 403 when a non-admin checks in inventory", async () => {
    getCurrentUserMock.mockResolvedValue({
      profile: { id: USER_ID, teamId: TEAM_ID, isAdmin: false },
    });

    const response = await PATCH(
      new Request("http://localhost/api/inventory/item-1/sign-outs/signout-1", {
        method: "PATCH",
      }),
      routeContext(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only admins can check in inventory.",
    });
    expect(returnTeamInventorySignOutMock).not.toHaveBeenCalled();
    expect(enforceApiRateLimitMock).not.toHaveBeenCalled();
  });

  it("allows admins to check in inventory", async () => {
    const updated = {
      id: "item-1",
      name: "Motor",
      signOuts: [],
    };
    getCurrentUserMock.mockResolvedValue({
      profile: { id: USER_ID, teamId: TEAM_ID, isAdmin: true },
    });
    returnTeamInventorySignOutMock.mockResolvedValue(updated);

    const response = await PATCH(
      new Request("http://localhost/api/inventory/item-1/sign-outs/signout-1", {
        method: "PATCH",
      }),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(updated);
    expect(returnTeamInventorySignOutMock).toHaveBeenCalledWith({
      inventoryItemId: "item-1",
      signOutId: "signout-1",
      teamId: TEAM_ID,
    });
  });
});
