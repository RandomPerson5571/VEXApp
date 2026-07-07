import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Fusion folder URN validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts Autodesk URNs and rejects arbitrary strings", async () => {
    const { isValidFusionFolderUrn } = await import(
      "@/lib/integrations/fusion/app.server"
    );

    expect(
      isValidFusionFolderUrn("urn:adsk.wipprod:fs.folder:co.abc123"),
    ).toBe(true);
    expect(isValidFusionFolderUrn("not-a-urn")).toBe(false);
  });
});
