import { afterEach, describe, expect, it, vi } from "vitest";

import { createInventoryItemFromApi } from "@/lib/queries/inventory";

describe("createInventoryItemFromApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the created item on success", async () => {
    const created = {
      id: "item-1",
      name: "Motor",
      description: null,
      totalStock: 2,
      imageUrl: null,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
      signOuts: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => created,
      }),
    );

    await expect(
      createInventoryItemFromApi({
        name: "Motor",
        totalStock: 2,
      }),
    ).resolves.toEqual(created);

    expect(fetch).toHaveBeenCalledWith("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Motor", totalStock: 2 }),
    });
  });

  it("throws the API error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Name is required." }),
      }),
    );

    await expect(
      createInventoryItemFromApi({ name: "", totalStock: 1 }),
    ).rejects.toThrow("Name is required.");
  });
});
