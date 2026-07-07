export type {
  Documentation,
  Event,
  Invite,
  Folder,
  InventoryItem,
  InventoryItemSignOut,
  NotebookLog,
  Prisma,
  Task,
  TaskAssignment,
  Team,
  TeamDayPlan,
  User,
} from "../generated/prisma/index.js";

export type {
  DayPlanType,
  DocType,
  EventType,
  TaskPriority,
  TaskStatus,
  TaskType,
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

export const folderWithDocsInclude = {
  docs: {
    select: { id: true, title: true, type: true, folderId: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies import("../generated/prisma/index.js").Prisma.FolderInclude;

/** Folder with document summaries — matches the documentation tree query shape. */
export type FolderWithDocs = import("../generated/prisma/index.js").Prisma.FolderGetPayload<{
  include: typeof folderWithDocsInclude;
}>;

export const documentationDetailInclude = {
  authors: { select: { id: true, firstName: true, lastName: true } },
  folder: { select: { id: true, name: true } },
} satisfies import("../generated/prisma/index.js").Prisma.DocumentationInclude;

/** Full documentation record with authors and folder — matches the detail query shape. */
export type DocumentationDetail = import("../generated/prisma/index.js").Prisma.DocumentationGetPayload<{
  include: typeof documentationDetailInclude;
}>;

export type FolderDocSummary = FolderWithDocs["docs"][number];
export type DocumentationAuthor = DocumentationDetail["authors"][number];

export const teamDayPlanInclude = {
  creator: { select: { id: true, firstName: true, lastName: true } },
} satisfies import("../generated/prisma/index.js").Prisma.TeamDayPlanInclude;

/** Team day plan with creator — matches the day-plans query shape. */
export type TeamDayPlanRecord = import("../generated/prisma/index.js").Prisma.TeamDayPlanGetPayload<{
  include: typeof teamDayPlanInclude;
}>;
