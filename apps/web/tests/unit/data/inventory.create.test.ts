import { prisma } from "@stlvex/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInventoryItem } from "@/lib/data/inventory";

vi.mock("server-only", () => ({}));

describe("createInventoryItem", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects negative stock before hitting the database", async () => {
    const create = vi.spyOn(prisma.inventoryItem, "create");

    await expect(
      createInventoryItem({
        name: "Motor",
        totalStock: -1,
      }),
    ).rejects.toThrow("Stock quantity cannot be negative.");

    expect(create).not.toHaveBeenCalled();
  });

  it("trims name, description, and imageUrl before persisting", async () => {
    const created = {
      id: "item-1",
      name: "Motor",
      description: "Green",
      totalStock: 3,
      imageUrl: "parts/motor.png",
      createdAt: new Date("2026-07-01"),
      updatedAt: new Date("2026-07-01"),
      signOuts: [],
    };

    const create = vi
      .spyOn(prisma.inventoryItem, "create")
      .mockResolvedValue(created as never);

    const result = await createInventoryItem({
      name: "  Motor  ",
      description: "  Green  ",
      totalStock: 3,
      imageUrl: "  parts/motor.png  ",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Motor",
        description: "Green",
        totalStock: 3,
        imageUrl: "parts/motor.png",
      },
      include: expect.any(Object),
    });
    expect(result).toEqual(created);
  });

  it("stores null for blank optional fields", async () => {
    const created = {
      id: "item-2",
      name: "Bearing",
      description: null,
      totalStock: 0,
      imageUrl: null,
      createdAt: new Date("2026-07-01"),
      updatedAt: new Date("2026-07-01"),
      signOuts: [],
    };

    const create = vi
      .spyOn(prisma.inventoryItem, "create")
      .mockResolvedValue(created as never);

    await createInventoryItem({
      name: "Bearing",
      description: "   ",
      totalStock: 0,
      imageUrl: "",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Bearing",
        description: null,
        totalStock: 0,
        imageUrl: null,
      },
      include: expect.any(Object),
    });
  });
});
