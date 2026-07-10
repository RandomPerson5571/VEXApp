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

export type EditTaskFormValues = CreateTaskFormValues & {
  status: TaskStatus;
};

export function dueDateToInputValue(
  dueDate: Date | string | null | undefined,
): string {
  const date = toDate(dueDate);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function taskToEditFormValues(task: TaskListTask): EditTaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    type: task.type,
    priority: task.priority ?? "Medium",
    dueDate: dueDateToInputValue(task.dueDate),
    assigneeIds: getTaskAssignees(task).map((assignee) => assignee.id),
    status: task.status,
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

export function formatPersonName(
  person: {
    firstName: string;
    lastName: string;
  } | null | undefined,
): string {
  if (!person) {
    return "Deleted user";
  }

  return `${person.firstName} ${person.lastName}`;
}

export function toDate(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function formatDueDate(
  dueDate: Date | string | null | undefined,
): string | null {
  const date = toDate(dueDate);
  if (!date) return null;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(
  dueDate: Date | string | null | undefined,
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
