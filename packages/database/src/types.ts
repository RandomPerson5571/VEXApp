export type {
  Documentation,
  Event,
  Invite,
  Folder,
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

const taskListTaskInclude = {
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
