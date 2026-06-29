import type {
  TeamInventoryBorrower,
  TeamInventoryItem,
  TeamInventorySignOut,
} from "@stlvex/database/types";

export type StockStatus = "nominal" | "low" | "depleted";
export type AvailabilityFilter = "all" | "available" | "checked-out" | "depleted";

export function getCheckedOutQuantity(signOuts: TeamInventorySignOut[]): number {
  return signOuts.reduce((sum, signOut) => sum + signOut.quantity, 0);
}

export function getTeamCheckedOutQuantity(
  item: TeamInventoryItem,
  teamId: string,
): number {
  return getCheckedOutQuantity(
    item.signOuts.filter((signOut) => signOut.teamId === teamId),
  );
}

export function getAvailableStock(item: TeamInventoryItem): number {
  return Math.max(0, item.totalStock - getCheckedOutQuantity(item.signOuts));
}

export function getStockStatus(item: TeamInventoryItem): StockStatus {
  const available = getAvailableStock(item);
  if (available <= 0) return "depleted";
  if (available <= Math.max(1, Math.floor(item.totalStock * 0.25))) return "low";
  return "nominal";
}

export function getStockFill(item: TeamInventoryItem): number {
  const target = Math.max(item.totalStock, 1);
  return Math.min(100, Math.round((getAvailableStock(item) / target) * 100));
}

export function getTeamSignOuts(
  item: TeamInventoryItem,
  teamId: string,
): TeamInventorySignOut[] {
  return item.signOuts.filter((signOut) => signOut.teamId === teamId);
}

export function getBorrowerInitials(person: TeamInventoryBorrower): string {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

export function formatBorrowerName(person: TeamInventoryBorrower): string {
  return `${person.firstName} ${person.lastName}`;
}

export function formatUpdatedAt(updatedAt: Date | string): string {
  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) return "—";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function matchesInventorySearch(
  item: TeamInventoryItem,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [item.name, item.description ?? ""].join(" ").toLowerCase();
  return haystack.includes(normalized);
}

export function matchesAvailabilityFilter(
  item: TeamInventoryItem,
  filter: AvailabilityFilter,
  teamId: string,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "available":
      return getAvailableStock(item) > 0;
    case "checked-out":
      return getTeamCheckedOutQuantity(item, teamId) > 0;
    case "depleted":
      return getAvailableStock(item) <= 0;
    default:
      return true;
  }
}

export function summarizeInventory(
  items: TeamInventoryItem[],
  teamId: string,
): {
  totalSkus: number;
  totalStock: number;
  availableUnits: number;
  teamCheckedOut: number;
  alerts: number;
  depleted: number;
} {
  let totalStock = 0;
  let availableUnits = 0;
  let teamCheckedOut = 0;
  let alerts = 0;
  let depleted = 0;

  for (const item of items) {
    totalStock += item.totalStock;
    availableUnits += getAvailableStock(item);
    teamCheckedOut += getTeamCheckedOutQuantity(item, teamId);

    const status = getStockStatus(item);
    if (status !== "nominal") alerts += 1;
    if (status === "depleted") depleted += 1;
  }

  return {
    totalSkus: items.length,
    totalStock,
    availableUnits,
    teamCheckedOut,
    alerts,
    depleted,
  };
}
