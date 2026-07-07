import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const getTeamDayPlansMock = vi.hoisted(() => vi.fn());
const setTeamDayPlanMock = vi.hoisted(() => vi.fn());
const clearTeamDayPlanMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/queries/day-plans.server", () => ({
  getTeamDayPlans: getTeamDayPlansMock,
  setTeamDayPlan: setTeamDayPlanMock,
  clearTeamDayPlan: clearTeamDayPlanMock,
}));

const { DELETE, GET, PUT } = await import("@/app/api/day-plans/route");

const TEAM_ID = "team-abc";
const USER_ID = "user-abc";
const PLAN_DATE = "2026-07-06";

function mockCurrentUser(overrides: { teamId?: string | null } = {}) {
  const teamId =
    overrides.teamId === undefined ? TEAM_ID : overrides.teamId;

  return {
    authUser: { id: USER_ID },
    profile: {
      id: USER_ID,
      teamId,
    },
    team: null,
  };
}

describe("api/day-plans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      getCurrentUserMock.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "Not authenticated.",
      });
    });

    it("returns an empty list when the user has no team", async () => {
      getCurrentUserMock.mockResolvedValue(mockCurrentUser({ teamId: null }));

      const response = await GET();

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([]);
      expect(getTeamDayPlansMock).not.toHaveBeenCalled();
    });

    it("returns team-scoped day plans", async () => {
      getCurrentUserMock.mockResolvedValue(mockCurrentUser());
      getTeamDayPlansMock.mockResolvedValue([
        { id: "plan-1", date: PLAN_DATE, type: "build" },
      ]);

      const response = await GET();

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        { id: "plan-1", date: PLAN_DATE, type: "build" },
      ]);
      expect(getTeamDayPlansMock).toHaveBeenCalledWith(TEAM_ID);
    });
  });

  describe("PUT", () => {
    it("returns 401 when not authenticated", async () => {
      getCurrentUserMock.mockResolvedValue(null);

      const response = await PUT(
        new Request("http://localhost/api/day-plans", {
          method: "PUT",
          body: JSON.stringify({ date: PLAN_DATE, type: "build" }),
        }),
      );

      expect(response.status).toBe(401);
    });

    it("creates a day plan", async () => {
      getCurrentUserMock.mockResolvedValue(mockCurrentUser());
      setTeamDayPlanMock.mockResolvedValue({
        id: "plan-new",
        date: PLAN_DATE,
        type: "build",
      });

      const response = await PUT(
        new Request("http://localhost/api/day-plans", {
          method: "PUT",
          body: JSON.stringify({ date: PLAN_DATE, type: "build" }),
        }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        id: "plan-new",
        date: PLAN_DATE,
        type: "build",
      });
      expect(setTeamDayPlanMock).toHaveBeenCalledWith({
        teamId: TEAM_ID,
        date: PLAN_DATE,
        type: "build",
        createdBy: USER_ID,
      });
    });

    it("updates the day plan type for an existing date", async () => {
      getCurrentUserMock.mockResolvedValue(mockCurrentUser());
      setTeamDayPlanMock.mockResolvedValue({
        id: "plan-1",
        date: PLAN_DATE,
        type: "testing",
      });

      const response = await PUT(
        new Request("http://localhost/api/day-plans", {
          method: "PUT",
          body: JSON.stringify({ date: PLAN_DATE, type: "testing" }),
        }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        id: "plan-1",
        date: PLAN_DATE,
        type: "testing",
      });
      expect(setTeamDayPlanMock).toHaveBeenCalledWith({
        teamId: TEAM_ID,
        date: PLAN_DATE,
        type: "testing",
        createdBy: USER_ID,
      });
    });
  });

  describe("DELETE", () => {
    it("returns 401 when not authenticated", async () => {
      getCurrentUserMock.mockResolvedValue(null);

      const response = await DELETE(
        new Request(`http://localhost/api/day-plans?date=${PLAN_DATE}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(401);
    });

    it("clears the day plan for the given date", async () => {
      getCurrentUserMock.mockResolvedValue(mockCurrentUser());
      clearTeamDayPlanMock.mockResolvedValue(undefined);

      const response = await DELETE(
        new Request(`http://localhost/api/day-plans?date=${PLAN_DATE}`, {
          method: "DELETE",
        }),
      );

      expect(response.status).toBe(204);
      expect(clearTeamDayPlanMock).toHaveBeenCalledWith(TEAM_ID, PLAN_DATE);
    });
  });
});
