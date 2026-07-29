import { describe, expect, it } from "vitest";

import {
  orderPlacedCustomId,
  parseOrderPlacedItemId,
} from "../../src/api/handlers/inventory-low-stock.js";
import {
  WEBHOOK_EVENT_TYPES,
  isWebhookEvent,
} from "../../src/api/types/webhook.js";

describe("inventory order-placed customId", () => {
  it("round-trips item id", () => {
    const customId = orderPlacedCustomId("item_abc");
    expect(parseOrderPlacedItemId(customId)).toBe("item_abc");
  });

  it("rejects unrelated customIds", () => {
    expect(parseOrderPlacedItemId("other:button")).toBeNull();
  });
});

describe("webhook event types", () => {
  it("includes telemetry and low-stock types", () => {
    expect(WEBHOOK_EVENT_TYPES).toContain("telemetry.actionable");
    expect(WEBHOOK_EVENT_TYPES).toContain("telemetry.security");
    expect(WEBHOOK_EVENT_TYPES).toContain("inventory.low_stock");
  });

  it("validates inventory.low_stock payload shape", () => {
    expect(
      isWebhookEvent({
        type: "inventory.low_stock",
        payload: {
          teamId: "t1",
          itemId: "i1",
          itemName: "Motor",
          available: 1,
          threshold: 2,
        },
      }),
    ).toBe(true);
  });
});
