export type StockStatus = "nominal" | "low" | "critical";
export type InventoryCategory =
  | "all"
  | "motors"
  | "structure"
  | "electronics"
  | "hardware";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: Exclude<InventoryCategory, "all">;
  quantity: number;
  minQuantity: number;
  location: string;
  lastUpdated: string;
  trend: "up" | "down" | "stable";
  trendDelta?: number;
}
