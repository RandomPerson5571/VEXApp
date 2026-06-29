import "server-only";

import { prisma } from "@stlvex/database";
import {
  teamInventoryItemInclude,
  type TeamInventoryItem,
} from "@stlvex/database/types";

import { resolveInventoryImageUrls } from "@/lib/supabase/inventory-images";

export async function listInventoryForTeam(
  _teamId: string,
): Promise<TeamInventoryItem[]> {
  const items = await prisma.inventoryItem.findMany({
    include: teamInventoryItemInclude,
    orderBy: { name: "asc" },
  });

  const resolvedImageUrls = await resolveInventoryImageUrls(
    items.map((item) => item.imageUrl),
  );

  return items.map((item, index) => ({
    ...item,
    imageUrl: resolvedImageUrls[index],
  }));
}
