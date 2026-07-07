import { prisma } from "@stlvex/database";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createInventoryItem, listInventoryForTeam } from "@/lib/data/inventory";
import {
  deleteTestInventoryItem,
  hasTestDatabase,
} from "../../helpers/auth/test-database";

vi.mock("server-only", () => ({}));

const describeIntegration = hasTestDatabase() ? describe : describe.skip;

describeIntegration("createInventoryItem integration", () => {
  const createdItemIds: string[] = [];

  afterEach(async () => {
    for (const id of createdItemIds.splice(0)) {
      await deleteTestInventoryItem(id);
    }
  });

  it("persists a new inventory item with active sign-outs included", async () => {
    const item = await createInventoryItem({
      name: `Vitest Motor ${crypto.randomUUID().slice(0, 8)}`,
      description: "Integration test part",
      totalStock: 6,
      imageUrl: "parts/motor.png",
    });
    createdItemIds.push(item.id);

    expect(item).toMatchObject({
      name: item.name,
      description: "Integration test part",
      totalStock: 6,
      imageUrl: "parts/motor.png",
      signOuts: [],
    });

    const stored = await prisma.inventoryItem.findUnique({
      where: { id: item.id },
    });
    expect(stored?.name).toBe(item.name);
    expect(stored?.totalStock).toBe(6);
  });

  it("appears in the team inventory list after creation", async () => {
    const name = `Vitest Bearing ${crypto.randomUUID().slice(0, 8)}`;
    const item = await createInventoryItem({
      name,
      totalStock: 10,
    });
    createdItemIds.push(item.id);

    const inventory = await listInventoryForTeam("any-team-id");
    expect(inventory.some((row) => row.id === item.id && row.name === name)).toBe(
      true,
    );
  });

  it("rejects negative stock against the real database layer", async () => {
    await expect(
      createInventoryItem({
        name: "Invalid stock item",
        totalStock: -1,
      }),
    ).rejects.toThrow("Stock quantity cannot be negative.");
  });
});
