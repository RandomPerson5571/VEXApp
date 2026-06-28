import type {
  TaskListAssignee,
  TaskListSubTask,
  TaskListTask,
  TaskStatus,
} from "@stlvex/database/types";

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

export function formatDueDate(dueDate: Date | null): string | null {
  if (!dueDate) return null;

  return dueDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(
  dueDate: Date | null,
  status: TaskStatus,
): boolean {
  if (!dueDate || status === "Done") return false;
  return dueDate.getTime() < Date.now();
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
