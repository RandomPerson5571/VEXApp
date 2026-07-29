import { describe, expect, it } from "vitest";

import { calculateOpr, type OprMatch } from "@/lib/robotevents/opr";

function match(
  red: string,
  redScore: number,
  blue: string,
  blueScore: number,
  overrides: Partial<OprMatch> = {},
): OprMatch {
  return {
    scored: true,
    round: 2,
    alliances: [
      { score: redScore, teams: [{ team: { name: red } }] },
      { score: blueScore, teams: [{ team: { name: blue } }] },
    ],
    ...overrides,
  };
}

describe("calculateOpr", () => {
  it("solves OPR, DPR, and CCWM from qualification scores", () => {
    const stats = calculateOpr([
      match("A", 30, "B", 10),
      match("A", 20, "C", 15),
      match("B", 12, "C", 18),
    ]);

    expect(stats.get("A")).toEqual({
      opr: expect.closeTo(25, 5),
      dpr: expect.closeTo(12.5, 5),
      ccwm: expect.closeTo(12.5, 5),
    });
    expect(stats.get("B")?.opr).toBeCloseTo(11);
    expect(stats.get("C")?.dpr).toBeCloseTo(16);
  });

  it("ignores unscored, non-qualification, and sitting teams", () => {
    const valid = match("A", 20, "B", 10);
    valid.alliances[0].teams.push({
      sitting: true,
      team: { name: "SITTING" },
    });

    const stats = calculateOpr([
      valid,
      match("UNSCORED", 99, "OTHER", 0, { scored: false }),
      match("ELIMS", 99, "OTHER", 0, { round: 3 }),
    ]);

    expect([...stats.keys()]).toEqual(["A", "B"]);
  });
});
