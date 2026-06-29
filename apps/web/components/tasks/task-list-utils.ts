import type {
  TaskListAssignee,
  TaskListSubTask,
  TaskListTask,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";

export type CreateTaskFormValues = {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  assigneeIds: string[];
};

type TaskPerson = {
  id: string;
  firstName: string;
  lastName: string;
};

export function parseDueDateFromForm(dueDate: string): Date | null {
  if (!dueDate.trim()) return null;
  return new Date(`${dueDate.trim()}T17:00:00.000Z`);
}

export function buildLocalTaskFromForm(
  values: CreateTaskFormValues,
  options: {
    teamId: string;
    creator: TaskPerson;
    roster: TaskPerson[];
  },
): TaskListTask {
  const now = new Date();
  const taskId = `local-${crypto.randomUUID()}`;
  const dueDate = parseDueDateFromForm(values.dueDate);

  const rosterById = new Map(options.roster.map((person) => [person.id, person]));
  const selectedAssignees = values.assigneeIds
    .map((id) => rosterById.get(id))
    .filter((person): person is TaskPerson => person !== undefined);

  return {
    id: taskId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    type: values.type,
    status: "NotStarted",
    priority: values.priority,
    dueDate,
    teamId: options.teamId,
    createdBy: options.creator.id,
    parentTaskId: null,
    creator: options.creator,
    assignments: selectedAssignees.map((user) => ({
      taskId,
      userId: user.id,
      assignedAt: now,
      user,
    })),
    createdAt: now,
    updatedAt: now,
    subTasks: [],
  };
}

export function getTaskAssignees(
  task: Pick<TaskListTask, "assignments"> | Pick<TaskListSubTask, "assignments">,
): TaskListAssignee[] {
  return task.assignments.map((assignment) => assignment.user);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatPersonName(person: {
  firstName: string;
  lastName: string;
}): string {
  return `${person.firstName} ${person.lastName}`;
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function formatDueDate(dueDate: Date | string | null): string | null {
  const date = toDate(dueDate);
  if (!date) return null;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(
  dueDate: Date | string | null,
  status: TaskStatus,
): boolean {
  const date = toDate(dueDate);
  if (!date || status === "Done") return false;
  return date.getTime() < Date.now();
}

export function getSubtaskProgress(subTasks: TaskListSubTask[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = subTasks.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };

  const completed = subTasks.filter((task) => task.status === "Done").length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

export function countTasksByStatus(
  tasks: TaskListTask[],
): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    NotStarted: 0,
    InProgress: 0,
    Done: 0,
  };

  for (const task of tasks) {
    counts[task.status] += 1;
    for (const sub of task.subTasks) {
      counts[sub.status] += 1;
    }
  }

  return counts;
}

export function countOverdueTasks(tasks: TaskListTask[]): number {
  let count = 0;

  for (const task of tasks) {
    if (isOverdue(task.dueDate, task.status)) count += 1;
    for (const sub of task.subTasks) {
      if (isOverdue(sub.dueDate, sub.status)) count += 1;
    }
  }

  return count;
}
