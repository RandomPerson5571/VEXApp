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

export type CreateInventoryItemInput = {
  name: string;
  description?: string | null;
  totalStock: number;
  checkoutLimit?: number | null;
  imageUrl?: string | null;
};

async function findInventoryItemOrThrow(
  inventoryItemId: string,
): Promise<TeamInventoryItem> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    include: teamInventoryItemInclude,
  });

  if (!item) {
    throw new Error("Inventory item not found.");
  }

  return item;
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<TeamInventoryItem> {
  if (input.totalStock < 0) {
    throw new Error("Stock quantity cannot be negative.");
  }

  if (
    input.checkoutLimit !== null &&
    input.checkoutLimit !== undefined &&
    input.checkoutLimit < 1
  ) {
    throw new Error("Checkout limit must be at least 1.");
  }

  return prisma.inventoryItem.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      totalStock: input.totalStock,
      checkoutLimit: input.checkoutLimit ?? null,
      imageUrl: input.imageUrl?.trim() || null,
    },
    include: teamInventoryItemInclude,
  });
}

export type UpdateInventoryItemInput = {
  itemId: string;
  name: string;
  description?: string | null;
  totalStock: number;
  checkoutLimit?: number | null;
  imageUrl?: string | null;
};

export async function updateInventoryItem(
  input: UpdateInventoryItemInput,
): Promise<TeamInventoryItem> {
  if (input.totalStock < 0) {
    throw new Error("Stock quantity cannot be negative.");
  }

  if (
    input.checkoutLimit !== null &&
    input.checkoutLimit !== undefined &&
    input.checkoutLimit < 1
  ) {
    throw new Error("Checkout limit must be at least 1.");
  }

  await findInventoryItemOrThrow(input.itemId);

  return prisma.inventoryItem.update({
    where: { id: input.itemId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      totalStock: input.totalStock,
      checkoutLimit: input.checkoutLimit ?? null,
      ...(input.imageUrl !== undefined
        ? { imageUrl: input.imageUrl?.trim() || null }
        : {}),
    },
    include: teamInventoryItemInclude,
  });
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  await findInventoryItemOrThrow(itemId);
  await prisma.inventoryItem.delete({ where: { id: itemId } });
}

export type SignOutInventoryItemInput = {
  inventoryItemId: string;
  teamId: string;
  userId: string;
  quantity: number;
};

export async function signOutInventoryItem(
  input: SignOutInventoryItemInput,
): Promise<TeamInventoryItem> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
      include: { signOuts: { where: { returnedAt: null } } },
    });

    if (!item) {
      throw new Error("Inventory item not found.");
    }

    const checkedOut = item.signOuts.reduce(
      (sum, signOut) => sum + signOut.quantity,
      0,
    );
    const available = item.totalStock - checkedOut;

    if (input.quantity > available) {
      throw new Error("Not enough stock available.");
    }

    if (item.checkoutLimit !== null && input.quantity > item.checkoutLimit) {
      throw new Error(`Checkout limit is ${item.checkoutLimit}.`);
    }

    await tx.inventoryItemSignOut.create({
      data: {
        inventoryItemId: input.inventoryItemId,
        teamId: input.teamId,
        userId: input.userId,
        quantity: input.quantity,
      },
    });
  });

  return findInventoryItemOrThrow(input.inventoryItemId);
}

export type ReturnInventorySignOutInput = {
  inventoryItemId: string;
  signOutId: string;
  teamId: string;
};

export async function returnInventorySignOut(
  input: ReturnInventorySignOutInput,
): Promise<TeamInventoryItem> {
  const signOut = await prisma.inventoryItemSignOut.findFirst({
    where: {
      id: input.signOutId,
      inventoryItemId: input.inventoryItemId,
      teamId: input.teamId,
      returnedAt: null,
    },
    select: { id: true },
  });

  if (!signOut) {
    throw new Error("Active sign-out not found.");
  }

  await prisma.inventoryItemSignOut.update({
    where: { id: signOut.id },
    data: { returnedAt: new Date() },
  });

  return findInventoryItemOrThrow(input.inventoryItemId);
}
