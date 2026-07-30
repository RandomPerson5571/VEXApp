import "server-only";

import { prisma } from "@stlvex/database";
import {
  teamInventoryItemInclude,
  type TeamInventoryItem,
} from "@stlvex/database/types";
import { normalizeInventoryColor } from "@/lib/inventory/item-colors";
import {
  getAvailableStock,
  getCheckedOutQuantity,
} from "@/lib/inventory/inventory-utils";
import {
  formatTelemetryDateTime,
  telemetryFields,
  truncateTelemetryValue,
} from "@/lib/telemetry/detail";
import { logTelemetry } from "@/lib/telemetry/dispatch";
import {
  formatUserName,
  inventoryItemCreatedMessage,
  inventoryItemDeletedMessage,
  inventoryItemUpdatedMessage,
  inventoryReturnMessage,
  inventorySignOutMessage,
} from "@/lib/telemetry/messages";

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
  teamId: string;
  actorId?: string;
  name: string;
  description?: string | null;
  totalStock: number;
  checkoutLimit?: number | null;
  imageUrl?: string | null;
  color?: string | null;
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

  const item = await prisma.inventoryItem.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      totalStock: input.totalStock,
      checkoutLimit: input.checkoutLimit ?? null,
      imageUrl: input.imageUrl?.trim() || null,
      color: normalizeInventoryColor(input.color),
    },
    include: teamInventoryItemInclude,
  });

  logTelemetry({
    category: "inventory",
    teamId: input.teamId,
    message: inventoryItemCreatedMessage(item.name),
    action: "inventory_item.created",
    entityType: "inventory_item",
    entityId: item.id,
    actorId: input.actorId,
    occurredAt: item.createdAt,
    fields: telemetryFields({
      Name: item.name,
      "Total stock": item.totalStock,
      "Checked out": getCheckedOutQuantity(item.signOuts),
      "Remaining stock": getAvailableStock(item),
      "Checkout limit": item.checkoutLimit ?? "None",
      Description: item.description
        ? truncateTelemetryValue(item.description)
        : undefined,
      Color: item.color ?? undefined,
    }),
  });

  return item;
}

export type UpdateInventoryItemInput = {
  itemId: string;
  teamId: string;
  actorId?: string;
  name: string;
  description?: string | null;
  totalStock: number;
  checkoutLimit?: number | null;
  imageUrl?: string | null;
  color?: string | null;
  lowStockThreshold?: number | null;
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

  const item = await prisma.inventoryItem.update({
    where: { id: input.itemId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      totalStock: input.totalStock,
      checkoutLimit: input.checkoutLimit ?? null,
      ...(input.lowStockThreshold !== undefined
        ? { lowStockThreshold: input.lowStockThreshold }
        : {}),
      ...(input.imageUrl !== undefined
        ? { imageUrl: input.imageUrl?.trim() || null }
        : {}),
      ...(input.color !== undefined
        ? { color: normalizeInventoryColor(input.color) }
        : {}),
    },
    include: teamInventoryItemInclude,
  });

  logTelemetry({
    category: "inventory",
    teamId: input.teamId,
    message: inventoryItemUpdatedMessage(item.name),
    action: "inventory_item.updated",
    entityType: "inventory_item",
    entityId: item.id,
    actorId: input.actorId,
    occurredAt: item.updatedAt,
    fields: telemetryFields({
      Name: item.name,
      "Total stock": item.totalStock,
      "Checked out": getCheckedOutQuantity(item.signOuts),
      "Remaining stock": getAvailableStock(item),
      "Checkout limit": item.checkoutLimit ?? "None",
      "Low stock threshold": item.lowStockThreshold ?? "Default",
      Description: item.description
        ? truncateTelemetryValue(item.description)
        : undefined,
      Color: item.color ?? undefined,
    }),
  });

  return item;
}

export async function deleteInventoryItem(
  itemId: string,
  teamId: string,
  actorId?: string,
): Promise<void> {
  const item = await findInventoryItemOrThrow(itemId);
  const checkedOut = getCheckedOutQuantity(item.signOuts);
  const remaining = getAvailableStock(item);
  await prisma.inventoryItem.delete({ where: { id: itemId } });
  logTelemetry({
    category: "inventory",
    teamId,
    message: inventoryItemDeletedMessage(item.name),
    action: "inventory_item.deleted",
    entityType: "inventory_item",
    entityId: itemId,
    actorId,
    occurredAt: new Date(),
    fields: telemetryFields({
      Name: item.name,
      "Total stock": item.totalStock,
      "Checked out": checkedOut,
      "Remaining stock": remaining,
    }),
  });
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

  const item = await findInventoryItemOrThrow(input.inventoryItemId);
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { firstName: true, lastName: true },
  });
  const userName = user
    ? formatUserName(user.firstName, user.lastName)
    : "Unknown user";

  logTelemetry({
    category: "inventory",
    teamId: input.teamId,
    message: inventorySignOutMessage(item.name, input.quantity, userName),
    action: "inventory.sign_out",
    entityType: "inventory_sign_out",
    entityId: input.inventoryItemId,
    actorId: input.userId,
    occurredAt: new Date(),
    fields: telemetryFields({
      Item: item.name,
      Quantity: input.quantity,
      User: userName,
      "User ID": input.userId,
      "Checked out": getCheckedOutQuantity(item.signOuts),
      "Remaining stock": getAvailableStock(item),
    }),
  });

  return item;
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
    select: {
      id: true,
      quantity: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!signOut) {
    throw new Error("Active sign-out not found.");
  }

  await prisma.inventoryItemSignOut.update({
    where: { id: signOut.id },
    data: { returnedAt: new Date() },
  });

  const item = await findInventoryItemOrThrow(input.inventoryItemId);
  const userName = formatUserName(
    signOut.user.firstName,
    signOut.user.lastName,
  );

  logTelemetry({
    category: "inventory",
    teamId: input.teamId,
    message: inventoryReturnMessage(item.name, signOut.quantity, userName),
    action: "inventory.return",
    entityType: "inventory_sign_out",
    entityId: signOut.id,
    actorId: signOut.userId,
    occurredAt: new Date(),
    fields: telemetryFields({
      Item: item.name,
      Quantity: signOut.quantity,
      User: userName,
      "Sign-out ID": signOut.id,
      "Checked out": getCheckedOutQuantity(item.signOuts),
      "Remaining stock": getAvailableStock(item),
    }),
  });

  return item;
}
