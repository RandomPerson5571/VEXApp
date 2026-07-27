import { describe, expect, it } from "vitest";

import { applyReorderToScoutNotes } from "@/lib/queries/cache-updates/scouting";
import type { ScoutNoteRecord } from "@/lib/queries/scouting";

function note(
  partial: Pick<ScoutNoteRecord, "id" | "pickRank" | "doNotPick"> &
    Partial<ScoutNoteRecord>,
): ScoutNoteRecord {
  return {
    teamId: "team-1",
    targetTeamNumber: partial.id,
    targetTeamName: null,
    content: "",
    driveRating: null,
    autonReliability: null,
    mechanisms: null,
    formNotes: null,
    crossedOff: false,
    createdById: "user-1",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    createdBy: { id: "user-1", firstName: "A", lastName: "B" },
    ...partial,
  };
}

describe("applyReorderToScoutNotes", () => {
  it("assigns contiguous ranks and clears omitted picklist members", () => {
    const notes = [
      note({ id: "a", pickRank: 1, doNotPick: false }),
      note({ id: "b", pickRank: 2, doNotPick: false }),
      note({ id: "c", pickRank: null, doNotPick: true }),
      note({ id: "d", pickRank: null, doNotPick: false }),
    ];

    const next = applyReorderToScoutNotes(notes, ["b", "a"], ["d"]);

    expect(next.find((n) => n.id === "b")).toMatchObject({
      pickRank: 1,
      doNotPick: false,
    });
    expect(next.find((n) => n.id === "a")).toMatchObject({
      pickRank: 2,
      doNotPick: false,
    });
    expect(next.find((n) => n.id === "d")).toMatchObject({
      pickRank: null,
      doNotPick: true,
    });
    expect(next.find((n) => n.id === "c")).toMatchObject({
      pickRank: null,
      doNotPick: false,
    });
  });
});
