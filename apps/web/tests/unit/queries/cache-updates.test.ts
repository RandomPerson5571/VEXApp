import { describe, expect, it } from "vitest";

import { QueryClient } from "@tanstack/react-query";

import {
  mergeDayPlanInList,
  removeDayPlanFromList,
  removeDayPlanFromListCache,
  upsertDayPlanInList,
} from "@/lib/queries/cache-updates/day-plans";
import { queryKeys } from "@/lib/query-client";

import {
  mergeTaskInList,
  patchDashboardTasksList,
} from "@/lib/queries/cache-updates/tasks";
import type {
  DashboardTask,
  TaskListTask,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";
import type { DayPlanType, TeamDayPlan } from "@/lib/types/team";

function buildTaskListTask(
  overrides: Partial<TaskListTask> & Pick<TaskListTask, "id" | "title">,
): TaskListTask {
  return {
    id: overrides.id,
    title: overrides.title,
    description: overrides.description ?? null,
    type: overrides.type ?? ("Hardware" as TaskType),
    priority: overrides.priority ?? "Medium",
    status: overrides.status ?? "NotStarted",
    dueDate: overrides.dueDate ?? null,
    teamId: overrides.teamId ?? "team-1",
    parentTaskId: overrides.parentTaskId ?? null,
    createdBy: overrides.createdBy ?? "user-1",
    createdAt: overrides.createdAt ?? new Date("2026-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2026-01-01"),
    creator: overrides.creator ?? {
      id: "user-1",
      firstName: "Ada",
      lastName: "Lovelace",
    },
    assignments: overrides.assignments ?? [],
    subTasks: overrides.subTasks ?? [],
  };
}

function buildDashboardTask(
  overrides: Partial<DashboardTask> & Pick<DashboardTask, "id" | "title">,
): DashboardTask {
  return {
    id: overrides.id,
    title: overrides.title,
    description: overrides.description ?? null,
    type: overrides.type ?? ("Hardware" as TaskType),
    priority: overrides.priority ?? "Medium",
    status: overrides.status ?? "NotStarted",
    dueDate: overrides.dueDate ?? null,
    teamId: overrides.teamId ?? "team-1",
    parentTaskId: overrides.parentTaskId ?? null,
    createdBy: overrides.createdBy ?? "user-1",
    createdAt: overrides.createdAt ?? new Date("2026-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2026-01-01"),
    assignments: overrides.assignments ?? [],
  };
}

describe("cache-updates/tasks", () => {
  it("replaces a task in the team list by id", () => {
    const original = buildTaskListTask({ id: "task-1", title: "Old title" });
    const updated = buildTaskListTask({ id: "task-1", title: "New title" });
    const other = buildTaskListTask({ id: "task-2", title: "Other task" });

    expect(mergeTaskInList([original, other], updated)).toEqual([updated, other]);
  });

  it("removes done tasks from the dashboard cache", () => {
    const dashboardTasks = [
      buildDashboardTask({ id: "task-1", title: "One" }),
      buildDashboardTask({ id: "task-2", title: "Two" }),
    ];
    const updated = buildTaskListTask({
      id: "task-1",
      title: "One",
      status: "Done" as TaskStatus,
    });

    expect(patchDashboardTasksList(dashboardTasks, updated)).toEqual([
      buildDashboardTask({ id: "task-2", title: "Two" }),
    ]);
  });

  it("patches title and status for dashboard tasks still in progress", () => {
    const dashboardTasks = [
      buildDashboardTask({
        id: "task-1",
        title: "Old",
        status: "NotStarted",
      }),
    ];
    const updated = buildTaskListTask({
      id: "task-1",
      title: "New",
      status: "InProgress",
    });

    expect(patchDashboardTasksList(dashboardTasks, updated)).toEqual([
      buildDashboardTask({
        id: "task-1",
        title: "New",
        status: "InProgress",
      }),
    ]);
  });
});

describe("cache-updates/day-plans", () => {
  function buildDayPlan(
    overrides: Partial<TeamDayPlan> & Pick<TeamDayPlan, "id" | "date" | "type">,
  ): TeamDayPlan {
    return {
      id: overrides.id,
      date: overrides.date,
      type: overrides.type,
    };
  }

  it("upserts a plan by date", () => {
    const existing = buildDayPlan({
      id: "plan-1",
      date: "2026-07-06",
      type: "build",
    });
    const other = buildDayPlan({
      id: "plan-2",
      date: "2026-07-07",
      type: "coding",
    });
    const updated = buildDayPlan({
      id: "plan-1",
      date: "2026-07-06",
      type: "testing",
    });

    expect(mergeDayPlanInList([existing, other], updated)).toEqual([updated, other]);
  });

  it("appends a plan when the date is new", () => {
    const existing = buildDayPlan({
      id: "plan-1",
      date: "2026-07-06",
      type: "build",
    });
    const added = buildDayPlan({
      id: "plan-2",
      date: "2026-07-07",
      type: "coding",
    });

    expect(mergeDayPlanInList([existing], added)).toEqual([existing, added]);
  });

  it("removes a plan by date", () => {
    const plans = [
      buildDayPlan({ id: "plan-1", date: "2026-07-06", type: "build" as DayPlanType }),
      buildDayPlan({ id: "plan-2", date: "2026-07-07", type: "coding" as DayPlanType }),
    ];

    expect(removeDayPlanFromList(plans, "2026-07-06")).toEqual([
      buildDayPlan({ id: "plan-2", date: "2026-07-07", type: "coding" }),
    ]);
  });

  it("upsertDayPlanInList merges into the team query cache", () => {
    const teamId = "team-1";
    const queryClient = new QueryClient();
    const existing = buildDayPlan({
      id: "plan-1",
      date: "2026-07-06",
      type: "build",
    });
    const other = buildDayPlan({
      id: "plan-2",
      date: "2026-07-07",
      type: "coding",
    });

    queryClient.setQueryData(queryKeys.dayPlans.forTeam(teamId), [existing, other]);

    const updated = buildDayPlan({
      id: "plan-1",
      date: "2026-07-06",
      type: "testing",
    });
    upsertDayPlanInList(queryClient, teamId, updated);

    expect(queryClient.getQueryData(queryKeys.dayPlans.forTeam(teamId))).toEqual([
      updated,
      other,
    ]);
  });

  it("upsertDayPlanInList seeds cache when empty", () => {
    const teamId = "team-1";
    const queryClient = new QueryClient();
    const plan = buildDayPlan({
      id: "plan-1",
      date: "2026-07-06",
      type: "build",
    });

    upsertDayPlanInList(queryClient, teamId, plan);

    expect(queryClient.getQueryData(queryKeys.dayPlans.forTeam(teamId))).toEqual([
      plan,
    ]);
  });

  it("removeDayPlanFromListCache drops the date from the team query cache", () => {
    const teamId = "team-1";
    const queryClient = new QueryClient();
    const plans = [
      buildDayPlan({ id: "plan-1", date: "2026-07-06", type: "build" }),
      buildDayPlan({ id: "plan-2", date: "2026-07-07", type: "coding" }),
    ];

    queryClient.setQueryData(queryKeys.dayPlans.forTeam(teamId), plans);
    removeDayPlanFromListCache(queryClient, teamId, "2026-07-06");

    expect(queryClient.getQueryData(queryKeys.dayPlans.forTeam(teamId))).toEqual([
      buildDayPlan({ id: "plan-2", date: "2026-07-07", type: "coding" }),
    ]);
  });
});
