import { prisma } from "@stlvex/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteTestInventoryItem,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

const verifyCurrentUserPermissionsMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/auth-guards-server", () => ({
  verifyCurrentUserPermissions: verifyCurrentUserPermissionsMock,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

import { POST } from "@/app/api/inventory/route";

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("POST /api/inventory integration", () => {
  const createdItemIds: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ profile: { id: "admin-user" } });
  });

  afterEach(async () => {
    for (const id of createdItemIds.splice(0)) {
      await deleteTestInventoryItem(id);
    }
  });

  it("returns 403 for non-global admins", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "TEAM",
      teamId: "team-1",
      role: "TEAM_LEADER",
    });

    const response = await POST(
      new Request("https://example.test/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name: "Motor", totalStock: 1 }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("creates an inventory item through the API route and database", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "GLOBAL",
    });

    const name = `API Motor ${crypto.randomUUID().slice(0, 8)}`;

    const response = await POST(
      new Request("https://example.test/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: "Created via API integration test",
          totalStock: 5,
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    createdItemIds.push(body.id);

    expect(body).toMatchObject({
      name,
      description: "Created via API integration test",
      totalStock: 5,
      signOuts: [],
    });

    const stored = await prisma.inventoryItem.findUnique({
      where: { id: body.id },
    });
    expect(stored?.name).toBe(name);
    expect(stored?.totalStock).toBe(5);
  });

  it("returns 400 when the database layer rejects invalid stock", async () => {
    verifyCurrentUserPermissionsMock.mockResolvedValue({
      authorized: true,
      scope: "GLOBAL",
    });

    const response = await POST(
      new Request("https://example.test/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name: "Bad stock", totalStock: -3 }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Stock quantity cannot be negative.",
    });
  });
});
