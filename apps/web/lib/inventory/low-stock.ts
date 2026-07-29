/**
 * Shared inventory stock helpers used by web + tests.
 * Threshold: explicit lowStockThreshold, else 25% heuristic.
 */

export function resolveLowStockThreshold(
  totalStock: number,
  lowStockThreshold: number | null | undefined,
): number {
  if (lowStockThreshold != null && lowStockThreshold >= 0) {
    return lowStockThreshold;
  }
  return Math.max(1, Math.floor(totalStock * 0.25));
}

export function isBelowLowStockThreshold(
  available: number,
  totalStock: number,
  lowStockThreshold: number | null | undefined,
): boolean {
  return available <= resolveLowStockThreshold(totalStock, lowStockThreshold);
}

export function shouldFireLowStockAlert(input: {
  available: number;
  totalStock: number;
  lowStockThreshold: number | null | undefined;
  restockPending: boolean;
}): boolean {
  if (input.restockPending) return false;
  return isBelowLowStockThreshold(
    input.available,
    input.totalStock,
    input.lowStockThreshold,
  );
}

export function shouldClearRestockPending(input: {
  available: number;
  totalStock: number;
  lowStockThreshold: number | null | undefined;
  restockPending: boolean;
}): boolean {
  if (!input.restockPending) return false;
  return !isBelowLowStockThreshold(
    input.available,
    input.totalStock,
    input.lowStockThreshold,
  );
}
