import { describe, expect, it } from "vitest";

import { buildEmbeddingInput } from "@/lib/knowledge/embedding-text";

describe("buildEmbeddingInput", () => {
  it("joins title and markdown content", () => {
    expect(
      buildEmbeddingInput({
        title: "PID Tuning",
        contentType: "MARKDOWN",
        content: "Use kP first.",
      }),
    ).toBe("# PID Tuning\n\nUse kP first.");
  });

  it("uses contentUrl for link nodes", () => {
    expect(
      buildEmbeddingInput({
        title: "Motor docs",
        contentType: "LINK",
        contentUrl: "https://example.com/motors",
      }),
    ).toBe("# Motor docs\n\nhttps://example.com/motors");
  });
});
