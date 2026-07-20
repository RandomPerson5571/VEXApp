import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/lib/query-client";
import { dashboardSummaryQueryOptions as clientDashboardSummaryQueryOptions } from "@/lib/queries/dashboard-summary";
import { teamDayPlansQueryOptions as clientTeamDayPlansQueryOptions } from "@/lib/queries/day-plans";
import { teamEventsQueryOptions as clientTeamEventsQueryOptions } from "@/lib/queries/events";
import { teamInventoryQueryOptions as clientTeamInventoryQueryOptions } from "@/lib/queries/inventory";
import {
  knowledgeEdgesQueryOptions,
  knowledgeNodesQueryOptions,
} from "@/lib/queries/knowledge";
import {
  dashboardTasksQueryOptions as clientDashboardTasksQueryOptions,
  teamTasksQueryOptions as clientTeamTasksQueryOptions,
} from "@/lib/queries/tasks";
import { teamMembersQueryOptions as clientTeamMembersQueryOptions } from "@/lib/queries/team-members";

vi.mock("server-only", () => ({}));

const { dashboardSummaryQueryOptions: serverDashboardSummaryQueryOptions } =
  await import("@/lib/queries/dashboard-summary.server");
const { teamDayPlansQueryOptions: serverTeamDayPlansQueryOptions } =
  await import("@/lib/queries/day-plans.server");
const { teamEventsQueryOptions: serverTeamEventsQueryOptions } =
  await import("@/lib/queries/events.server");
const { teamInventoryQueryOptions: serverTeamInventoryQueryOptions } =
  await import("@/lib/queries/inventory.server");
const {
  dashboardTasksQueryOptions: serverDashboardTasksQueryOptions,
  teamTasksQueryOptions: serverTeamTasksQueryOptions,
} = await import("@/lib/queries/tasks.server");
const { teamMembersQueryOptions: serverTeamMembersQueryOptions } =
  await import("@/lib/queries/team-members.server");

const TEAM_ID = "team-123";

describe("query options key alignment", () => {
  it("team tasks client and server wrappers share queryKey", () => {
    const clientKey = clientTeamTasksQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverTeamTasksQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.tasks.forTeam(TEAM_ID));
  });

  it("dashboard tasks client and server wrappers share queryKey with default limit", () => {
    const clientKey = clientDashboardTasksQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverDashboardTasksQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.dashboard.tasks(TEAM_ID, 4));
  });

  it("dashboard tasks queryKey includes custom limit", () => {
    const clientKey = clientDashboardTasksQueryOptions(TEAM_ID, 8).queryKey;
    const serverKey = serverDashboardTasksQueryOptions(TEAM_ID, 8).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.dashboard.tasks(TEAM_ID, 8));
  });

  it("team inventory client and server wrappers share queryKey", () => {
    const clientKey = clientTeamInventoryQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverTeamInventoryQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.inventory.forTeam(TEAM_ID));
  });

  it("team day plans client and server wrappers share queryKey", () => {
    const clientKey = clientTeamDayPlansQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverTeamDayPlansQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.dayPlans.forTeam(TEAM_ID));
  });

  it("team events client and server wrappers share queryKey", () => {
    const clientKey = clientTeamEventsQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverTeamEventsQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.events.forTeam(TEAM_ID));
  });

  it("dashboard summary client and server wrappers share queryKey", () => {
    const clientKey = clientDashboardSummaryQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverDashboardSummaryQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.dashboard.summary(TEAM_ID));
  });

  it("team members client and server wrappers share queryKey", () => {
    const clientKey = clientTeamMembersQueryOptions(TEAM_ID).queryKey;
    const serverKey = serverTeamMembersQueryOptions(TEAM_ID).queryKey;

    expect(clientKey).toEqual(serverKey);
    expect(clientKey).toEqual(queryKeys.teams.members(TEAM_ID));
  });

  it("knowledge nodes and edges queryKeys match shared keys", () => {
    expect(knowledgeNodesQueryOptions(TEAM_ID).queryKey).toEqual(
      queryKeys.knowledge.nodes(TEAM_ID),
    );
    expect(knowledgeEdgesQueryOptions(TEAM_ID).queryKey).toEqual(
      queryKeys.knowledge.edges(TEAM_ID),
    );
  });
});
