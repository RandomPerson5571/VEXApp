import { describe, expect, it } from "vitest";

import {
  mergeDocInTree,
} from "@/lib/queries/cache-updates/documentation";
import {
  mergeTaskInList,
  patchDashboardTasksList,
} from "@/lib/queries/cache-updates/tasks";
import type {
  DashboardTask,
  DocType,
  DocumentationDetail,
  FolderWithDocs,
  TaskListTask,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";

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

describe("cache-updates/documentation", () => {
  it("merges doc title and type into the documentation tree", () => {
    const folders: FolderWithDocs[] = [
      {
        id: "folder-1",
        name: "Design",
        docs: [
          {
            id: "doc-1",
            title: "Old title",
            type: "GENERAL" as DocType,
            folderId: "folder-1",
            createdAt: new Date("2026-01-01"),
          },
        ],
      },
    ];

    const detail = {
      id: "doc-1",
      title: "New title",
      type: "CAD" as DocType,
      content: "Body",
      folderId: "folder-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      authors: [],
      folder: { id: "folder-1", name: "Design" },
    } as DocumentationDetail;

    expect(mergeDocInTree(folders, detail)).toEqual([
      {
        ...folders[0],
        docs: [
          {
            id: "doc-1",
            title: "New title",
            type: "CAD",
            folderId: "folder-1",
            createdAt: new Date("2026-01-01"),
          },
        ],
      },
    ]);
  });
});
