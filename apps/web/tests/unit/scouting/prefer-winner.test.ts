import { describe, expect, it } from "vitest";

import { preferWinnerInPicklist } from "@/lib/scouting/prefer-winner";

describe("preferWinnerInPicklist", () => {
  it("places winner directly above loser when both ranked", () => {
    const result = preferWinnerInPicklist(
      ["a", "b", "c", "d"],
      [],
      "d",
      "b",
    );
    expect(result.orderedNoteIds).toEqual(["a", "d", "b", "c"]);
  });

  it("pulls winner out of DNP above a ranked loser", () => {
    const result = preferWinnerInPicklist(["a", "b"], ["c"], "c", "b");
    expect(result.orderedNoteIds).toEqual(["a", "c", "b"]);
    expect(result.dnpNoteIds).toEqual([]);
  });
});
