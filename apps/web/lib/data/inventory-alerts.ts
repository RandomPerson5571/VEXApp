import "server-only";

import { prisma } from "@stlvex/database";
import {
  teamInventoryItemInclude,
  type TeamInventoryItem,
} from "@stlvex/database/types";

import {
  shouldClearRestockPending,
  shouldFireLowStockAlert,
} from "@/lib/inventory/low-stock";
import { dispatchLowStockAlert } from "@/lib/telemetry/dispatch";

function availableFromItem(item: {
  totalStock: number;
  signOuts: { quantity: number }[];
}): number {
  const checkedOut = item.signOuts.reduce((sum, s) => sum + s.quantity, 0);
  return Math.max(0, item.totalStock - checkedOut);
}

/**
 * After stock-changing mutations: fire low-stock once (mute via restockPending),
 * or clear mute when replenished. teamId used for Discord routing.
 */
export async function syncInventoryStockAlerts(
  itemId: string,
  teamId: string,
): Promise<TeamInventoryItem> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      signOuts: { where: { returnedAt: null }, select: { quantity: true } },
    },
  });

  if (!item) {
    throw new Error("Inventory item not found.");
  }

  const available = availableFromItem(item);

  if (
    shouldFireLowStockAlert({
      available,
      totalStock: item.totalStock,
      lowStockThreshold: item.lowStockThreshold,
      restockPending: item.restockPending,
    })
  ) {
    const threshold =
      item.lowStockThreshold != null && item.lowStockThreshold >= 0
        ? item.lowStockThreshold
        : Math.max(1, Math.floor(item.totalStock * 0.25));

    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { restockPending: true },
    });

    dispatchLowStockAlert({
      teamId,
      itemId: item.id,
      itemName: item.name,
      available,
      threshold,
    });
  } else if (
    shouldClearRestockPending({
      available,
      totalStock: item.totalStock,
      lowStockThreshold: item.lowStockThreshold,
      restockPending: item.restockPending,
    })
  ) {
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { restockPending: false, orderPlacedAt: null },
    });
  }

  const refreshed = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: teamInventoryItemInclude,
  });

  if (!refreshed) {
    throw new Error("Inventory item not found.");
  }

  return refreshed;
}

export async function markInventoryOrderPlaced(itemId: string): Promise<TeamInventoryItem> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    select: { id: true, restockPending: true },
  });

  if (!item) {
    throw new Error("Inventory item not found.");
  }

  return prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      orderPlacedAt: new Date(),
      // ensure muted even if alert path was skipped
      restockPending: true,
    },
    include: teamInventoryItemInclude,
  });
}
