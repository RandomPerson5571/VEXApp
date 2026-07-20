export type {
  Event,
  Invite,
  InventoryItem,
  InventoryItemSignOut,
  KnowledgeEdge,
  KnowledgeNode,
  NotebookLog,
  Prisma,
  ScoutNote,
  Task,
  TaskAssignment,
  Team,
  TeamDayPlan,
  User,
} from "../generated/prisma/index.js";

export type {
  ContentType,
  DayPlanType,
  EventType,
  TaskPriority,
  TaskStatus,
  TaskType,
  TopicCategory,
  UserRole,
} from "../generated/prisma/index.js";

export const taskListTaskInclude = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignments: {
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  },
  subTasks: {
    include: {
      creator: { select: { id: true, firstName: true, lastName: true } },
      assignments: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  },
} satisfies import("../generated/prisma/index.js").Prisma.TaskInclude;

/** Task with creator, assignees, and one level of subtasks — matches the task list query shape. */
export type TaskListTask = import("../generated/prisma/index.js").Prisma.TaskGetPayload<{
  include: typeof taskListTaskInclude;
}>;

export type TaskListSubTask = TaskListTask["subTasks"][number];

export type TaskListAssignee = TaskListSubTask["assignments"][number]["user"];

export const dashboardTaskInclude = {
  assignments: {
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies import("../generated/prisma/index.js").Prisma.TaskInclude;

/** Top-level task with assignees only — matches the dashboard widget query shape. */
export type DashboardTask = import("../generated/prisma/index.js").Prisma.TaskGetPayload<{
  include: typeof dashboardTaskInclude;
}>;

export const teamInventoryItemInclude = {
  signOuts: {
    where: { returnedAt: null },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { signedOutAt: "desc" as const },
  },
} satisfies import("../generated/prisma/index.js").Prisma.InventoryItemInclude;

/** Inventory item with active sign-outs and borrower details — matches the team inventory query shape. */
export type TeamInventoryItem = import("../generated/prisma/index.js").Prisma.InventoryItemGetPayload<{
  include: typeof teamInventoryItemInclude;
}>;

export type TeamInventorySignOut = TeamInventoryItem["signOuts"][number];
export type TeamInventoryBorrower = TeamInventorySignOut["user"];

export const knowledgeNodeInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies import("../generated/prisma/index.js").Prisma.KnowledgeNodeInclude;

/** Knowledge node with creator — matches the graph/detail query shape. */
export type KnowledgeNodeDetail = import("../generated/prisma/index.js").Prisma.KnowledgeNodeGetPayload<{
  include: typeof knowledgeNodeInclude;
}>;

export type KnowledgeNodeCreator = KnowledgeNodeDetail["createdBy"];

export const knowledgeEdgeInclude = {
  source: { select: { id: true, title: true, teamId: true } },
  target: { select: { id: true, title: true, teamId: true } },
} satisfies import("../generated/prisma/index.js").Prisma.KnowledgeEdgeInclude;

/** Knowledge edge with source/target summaries. */
export type KnowledgeEdgeDetail = import("../generated/prisma/index.js").Prisma.KnowledgeEdgeGetPayload<{
  include: typeof knowledgeEdgeInclude;
}>;

export const scoutNoteInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies import("../generated/prisma/index.js").Prisma.ScoutNoteInclude;

/** Scout note with creator. */
export type ScoutNoteDetail = import("../generated/prisma/index.js").Prisma.ScoutNoteGetPayload<{
  include: typeof scoutNoteInclude;
}>;

export const teamDayPlanInclude = {
  creator: { select: { id: true, firstName: true, lastName: true } },
} satisfies import("../generated/prisma/index.js").Prisma.TeamDayPlanInclude;

/** Team day plan with creator — matches the day-plans query shape. */
export type TeamDayPlanRecord = import("../generated/prisma/index.js").Prisma.TeamDayPlanGetPayload<{
  include: typeof teamDayPlanInclude;
}>;
