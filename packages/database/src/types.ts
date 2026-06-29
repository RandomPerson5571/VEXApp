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
  User,
} from "../generated/prisma/index.js";

export type {
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
