import "server-only";

import { prisma } from "@stlvex/database";
import {
  teamInventoryItemInclude,
  type TeamInventoryItem,
} from "@stlvex/database/types";

export async function countInventoryItems(): Promise<number> {
  return prisma.inventoryItem.count();
}

/** True when any SKU has no units available (totalStock minus active sign-outs). */
export async function hasDepletedInventory(): Promise<boolean> {
  const [zeroStockCount, checkedOutByItem] = await Promise.all([
    prisma.inventoryItem.count({ where: { totalStock: { lte: 0 } } }),
    prisma.inventoryItemSignOut.groupBy({
      by: ["inventoryItemId"],
      where: { returnedAt: null },
      _sum: { quantity: true },
    }),
  ]);

  if (zeroStockCount > 0) return true;
  if (checkedOutByItem.length === 0) return false;

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: checkedOutByItem.map((row) => row.inventoryItemId) } },
    select: { id: true, totalStock: true },
  });
  const stockById = new Map(items.map((item) => [item.id, item.totalStock]));

  return checkedOutByItem.some((row) => {
    const totalStock = stockById.get(row.inventoryItemId) ?? 0;
    const checkedOut = row._sum.quantity ?? 0;
    return totalStock - checkedOut <= 0;
  });
}

export async function listInventoryForTeam(
  _teamId: string,
): Promise<TeamInventoryItem[]> {
  return prisma.inventoryItem.findMany({
    include: teamInventoryItemInclude,
    orderBy: { name: "asc" },
  });
}
