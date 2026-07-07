import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteDayPlan,
  listDayPlansForTeam,
  upsertDayPlan,
} from "@/lib/data/day-plans";
import { toTeamDayPlan, toTeamDayPlans } from "@/lib/mappers/day-plans";

import {
  createTestTeam,
  createTestUser,
  deleteTestTeam,
  deleteTestUser,
  hasDayPlansTable,
} from "../helpers/auth/test-database";

vi.mock("server-only", () => ({}));

const describeIntegration = (await hasDayPlansTable()) ? describe : describe.skip;

describeIntegration("day plans integration", () => {
  let teamAId = "";
  let teamBId = "";
  let userId = "";
  const PLAN_DATE = "2026-07-06";

  beforeEach(async () => {
    const [teamA, teamB, user] = await Promise.all([
      createTestTeam(),
      createTestTeam(),
      createTestUser(),
    ]);
    teamAId = teamA.id;
    teamBId = teamB.id;
    userId = user.id;
  });

  afterEach(async () => {
    if (userId) {
      await deleteTestUser(userId);
      userId = "";
    }

    if (teamAId) {
      await deleteTestTeam(teamAId);
      teamAId = "";
    }

    if (teamBId) {
      await deleteTestTeam(teamBId);
      teamBId = "";
    }
  });

  it("creates a day plan with PUT-equivalent server logic", async () => {
    const plan = toTeamDayPlan(
      await upsertDayPlan({
        teamId: teamAId,
        date: PLAN_DATE,
        type: "BUILD",
        createdBy: userId,
      }),
    );

    expect(plan).toMatchObject({
      date: PLAN_DATE,
      type: "build",
    });

    const plans = toTeamDayPlans(await listDayPlansForTeam(teamAId));
    expect(plans).toEqual([plan]);
  });

  it("updates the day plan type for an existing date", async () => {
    await upsertDayPlan({
      teamId: teamAId,
      date: PLAN_DATE,
      type: "BUILD",
      createdBy: userId,
    });

    const updated = toTeamDayPlan(
      await upsertDayPlan({
        teamId: teamAId,
        date: PLAN_DATE,
        type: "TESTING",
        createdBy: userId,
      }),
    );

    expect(updated.type).toBe("testing");

    const plans = toTeamDayPlans(await listDayPlansForTeam(teamAId));
    expect(plans).toHaveLength(1);
    expect(plans[0]?.type).toBe("testing");
  });

  it("clears a day plan with DELETE-equivalent server logic", async () => {
    await upsertDayPlan({
      teamId: teamAId,
      date: PLAN_DATE,
      type: "BUILD",
      createdBy: userId,
    });

    await deleteDayPlan(teamAId, PLAN_DATE);

    await expect(listDayPlansForTeam(teamAId)).resolves.toEqual([]);
  });

  it("returns only plans for the requested team", async () => {
    const teamAPlan = toTeamDayPlan(
      await upsertDayPlan({
        teamId: teamAId,
        date: PLAN_DATE,
        type: "BUILD",
        createdBy: userId,
      }),
    );
    const teamBPlan = toTeamDayPlan(
      await upsertDayPlan({
        teamId: teamBId,
        date: PLAN_DATE,
        type: "CODING",
        createdBy: userId,
      }),
    );

    expect(toTeamDayPlans(await listDayPlansForTeam(teamAId))).toEqual([
      teamAPlan,
    ]);
    expect(toTeamDayPlans(await listDayPlansForTeam(teamBId))).toEqual([
      teamBPlan,
    ]);
  });
});
