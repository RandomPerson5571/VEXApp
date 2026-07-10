import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());
const createTeamInventoryItemMock = vi.hoisted(() => vi.fn());
const getTeamInventoryMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());
const enforceApiRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/security/enforce-api-rate-limit", () => ({
  enforceApiRateLimit: enforceApiRateLimitMock,
}));

vi.mock("@/lib/queries/inventory.server", () => ({
  createTeamInventoryItem: createTeamInventoryItemMock,
  getTeamInventory: getTeamInventoryMock,
}));

const { GET, POST } = await import("@/app/api/inventory/route");

const TEAM_ID = "team-abc";
const USER_ID = "user-abc";

function mockGlobalAdmin() {
  verifyCurrentUserPermissionsMock.mockResolvedValue({
    authorized: true,
    scope: "GLOBAL",
  });
  getCurrentUserMock.mockResolvedValue({
    profile: { id: USER_ID, teamId: TEAM_ID },
  });
}

function buildCreatedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    name: "REV HD Hex Motor",
    description: "Green cartridge",
    totalStock: 4,
    imageUrl: null,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    signOuts: [],
    ...overrides,
  };
}

describe("api/inventory POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceApiRateLimitMock.mockResolvedValue(null);
  });

  it("returns 403 when the user is not a global admin", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId: TEAM_ID,
      role: "MEMBER",
    });

    const response = await POST(
      new Request("http://localhost/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name: "Motor", totalStock: 1 }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden." });
    expect(createTeamInventoryItemMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    mockGlobalAdmin();

    const response = await POST(
      new Request("http://localhost/api/inventory", {
        method: "POST",
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body.",
    });
  });

  it("returns 400 when name is missing", async () => {
    mockGlobalAdmin();

    const response = await POST(
      new Request("http://localhost/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name: "   ", totalStock: 2 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Name is required.",
    });
  });

  it("returns 400 when total stock is not a whole number", async () => {
    mockGlobalAdmin();

    const response = await POST(
      new Request("http://localhost/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name: "Motor", totalStock: 1.5 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Total stock must be a whole number.",
    });
  });

  it("creates an inventory item for global admins", async () => {
    mockGlobalAdmin();
    const created = buildCreatedItem();
    createTeamInventoryItemMock.mockResolvedValue(created);

    const response = await POST(
      new Request("http://localhost/api/inventory", {
        method: "POST",
        body: JSON.stringify({
          name: "  REV HD Hex Motor  ",
          description: "Green cartridge",
          totalStock: 4,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: "item-1",
      name: "REV HD Hex Motor",
      description: "Green cartridge",
      totalStock: 4,
      imageUrl: null,
      signOuts: [],
    });
    expect(createTeamInventoryItemMock).toHaveBeenCalledWith({
      name: "REV HD Hex Motor",
      description: "Green cartridge",
      totalStock: 4,
      imageUrl: null,
    });
  });

  it("returns 400 when the data layer rejects negative stock", async () => {
    mockGlobalAdmin();
    createTeamInventoryItemMock.mockRejectedValue(
      new Error("Stock quantity cannot be negative."),
    );

    const response = await POST(
      new Request("http://localhost/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name: "Motor", totalStock: -1 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Stock quantity cannot be negative.",
    });
  });
});
