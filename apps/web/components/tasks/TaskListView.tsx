"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, ClipboardList, Plus } from "lucide-react";

import { useProfile, useTeam } from "@/components/providers/UserProvider";
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useTeamMembers } from "@/lib/hooks/use-team-members";
import { useTeamTaskMutations } from "@/lib/hooks/use-team-task-mutations";
import { useTeamTasks } from "@/lib/hooks/use-team-tasks";
import type {
  TaskListTask,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@stlvex/database/types";
import {
  CreateTaskModal,
  emptyCreateTaskFormValues,
} from "./CreateTaskModal";
import {
  TaskCard,
  TaskFilters,
  TaskListStats,
} from "./TaskListComponents";
import {
  type CreateTaskFormValues,
  type EditTaskFormValues,
  formatPersonName,
  getTaskAssignees,
  taskToEditFormValues,
} from "./task-list-utils";

type TaskStatusFilter = TaskStatus | "all";
type TaskTypeFilter = TaskType | "all";
type TaskPriorityFilter = TaskPriority | "all";

function matchesSearch(task: TaskListTask, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const assignees = getTaskAssignees(task);
  const haystack = [
    task.title,
    task.description ?? "",
    task.creator?.firstName ?? "",
    task.creator?.lastName ?? "",
    ...assignees.flatMap((a) => [a.firstName, a.lastName]),
    ...task.subTasks.map((s) => s.title),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function filterTasks(
  tasks: TaskListTask[],
  search: string,
  status: TaskStatusFilter,
  type: TaskTypeFilter,
  priority: TaskPriorityFilter,
): TaskListTask[] {
  return tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    if (type !== "all" && task.type !== type) return false;
    if (priority !== "all" && task.priority !== priority) return false;
    return matchesSearch(task, search);
  });
}

function TaskListFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 dark:bg-[#000000] p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60">
          <ClipboardList className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-slate-100">No team assigned</h1>
        <p className="mt-2 text-sm text-slate-400">
          Join or select a team to view your task list.
        </p>
      </div>
    </div>
  );
}

export function TaskListView() {
  const team = useTeam();
  const profile = useProfile();
  const tasksQuery = useTeamTasks();
  const { data: fetchedTasks = [], isError } = tasksQuery;
  const isInitialLoading = isQueryInitiallyLoading(tasksQuery);
  const { data: teamMembers = [] } = useTeamMembers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateTaskFormValues>(
    emptyCreateTaskFormValues,
  );
  const [editForm, setEditForm] = useState<EditTaskFormValues | null>(null);

  const label = team ? `${team.name} (${team.number})` : "Your team";
  const teamId = team?.id;
  const creator = {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };

  const { createMutation: createTaskMutation, updateMutation: updateTaskMutation, updateTaskStatus, isStatusUpdating } =
    useTeamTaskMutations({
      teamId,
      creator,
      onCreateSuccess: () => {
        setIsCreateModalOpen(false);
        setCreateForm(emptyCreateTaskFormValues);
      },
      onUpdateSuccess: () => {
        setIsEditModalOpen(false);
        setEditingTaskId(null);
        setEditForm(null);
      },
    });

  const tasks = fetchedTasks;
  const editingTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId) ?? null
    : null;

  const assigneeOptions = useMemo(() => {
    const roster = new Map(
      teamMembers.map((member) => [member.id, member]),
    );
    roster.set(creator.id, creator);
    return Array.from(roster.values());
  }, [teamMembers, creator]);

  const filteredTasks = useMemo(
    () => filterTasks(tasks, search, statusFilter, typeFilter, priorityFilter),
    [tasks, search, statusFilter, typeFilter, priorityFilter],
  );

  function openCreateModal() {
    setCreateForm(emptyCreateTaskFormValues);
    createTaskMutation.reset();
    setIsCreateModalOpen(true);
  }

  function openEditModal(task: TaskListTask) {
    setEditingTaskId(task.id);
    setEditForm(taskToEditFormValues(task));
    updateTaskMutation.reset();
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    if (!updateTaskMutation.isPending) {
      setIsEditModalOpen(false);
      setEditingTaskId(null);
      setEditForm(null);
      updateTaskMutation.reset();
    }
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createTaskMutation.mutate({
      title: createForm.title,
      description: createForm.description,
      type: createForm.type,
      priority: createForm.priority,
      dueDate: createForm.dueDate || undefined,
      assigneeIds: createForm.assigneeIds,
    });
  }

  function handleEditTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTaskId || !editForm) return;

    updateTaskMutation.mutate({
      taskId: editingTaskId,
      title: editForm.title,
      description: editForm.description,
      status: editForm.status,
      type: editForm.type,
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
      assigneeIds: editForm.assigneeIds,
    });
  }

  if (!team) {
    return <TaskListFallback />;
  }

  return (
    <div className="relative flex-1 overflow-y-auto bg-slate-50 px-8 py-6 font-sans dashboard-scroll dark:bg-[#000000]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_55%)]"
      />

      <div className="relative">
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/80">
                    Team workspace
                  </p>
                  <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-black leading-none tracking-tight text-slate-950 dark:text-slate-100">
                    Task List
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                Track build, software, and CAD work for {label}. Any team member
                can create tasks — expand a card to view subtasks and progress.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={isInitialLoading}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:scale-[1.02] motion-reduce:transition-none"
            >
              <Plus className="h-4 w-4" />
              New task
            </button>
          </div>
        </header>

        {isInitialLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60"
                />
              ))}
            </div>
            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#121212]/60"
                />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-200">
              Unable to load tasks
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-500">
              Something went wrong while fetching your team&apos;s tasks. Please
              refresh and try again.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              <TaskListStats tasks={tasks} />
              <TaskFilters
                search={search}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                priorityFilter={priorityFilter}
                onSearchChange={setSearch}
                onStatusChange={(value) =>
                  setStatusFilter(value as TaskStatusFilter)
                }
                onTypeChange={(value) => setTypeFilter(value as TaskTypeFilter)}
                onPriorityChange={(value) =>
                  setPriorityFilter(value as TaskPriorityFilter)
                }
                resultCount={filteredTasks.length}
              />
            </div>

            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-[#121212]/60">
                  <ClipboardList className="h-7 w-7 text-slate-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-200">No tasks found</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-500">
                  {tasks.length === 0
                    ? "Create your first task to start tracking team work."
                    : "Try adjusting your filters or search query."}
                </p>
                {tasks.length === 0 ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                    Create task
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                {filteredTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    defaultExpanded={index === 0}
                    onOpen={() => openEditModal(task)}
                    onUpdateTitle={(title) => {
                      updateTaskMutation.mutate({ taskId: task.id, title });
                      return Promise.resolve();
                    }}
                    onUpdateDescription={(description) => {
                      updateTaskMutation.mutate({
                        taskId: task.id,
                        description,
                      });
                      return Promise.resolve();
                    }}
                    onUpdateStatus={async (status) => {
                      updateTaskStatus(task.id, status);
                    }}
                    onUpdatePriority={(priority) => {
                      updateTaskMutation.mutate({
                        taskId: task.id,
                        priority,
                      });
                      return Promise.resolve();
                    }}
                    isStatusUpdating={isStatusUpdating(task.id)}
                    isPriorityUpdating={
                      updateTaskMutation.isPending &&
                      updateTaskMutation.variables?.taskId === task.id &&
                      updateTaskMutation.variables?.priority !== undefined
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        values={createForm}
        assigneeOptions={assigneeOptions}
        onChange={setCreateForm}
        onClose={() => {
          if (!createTaskMutation.isPending) {
            setIsCreateModalOpen(false);
            createTaskMutation.reset();
          }
        }}
        onSubmit={handleCreateTask}
        isSubmitting={createTaskMutation.isPending}
        submitError={
          createTaskMutation.isError
            ? createTaskMutation.error instanceof Error
              ? createTaskMutation.error.message
              : "Failed to create task."
            : null
        }
      />

      {editForm && editingTask ? (
        <CreateTaskModal
          mode="edit"
          isOpen={isEditModalOpen}
          values={editForm}
          assigneeOptions={assigneeOptions}
          onChange={(values) => setEditForm(values as EditTaskFormValues)}
          onClose={closeEditModal}
          onSubmit={handleEditTask}
          isSubmitting={updateTaskMutation.isPending}
          submitError={
            updateTaskMutation.isError
              ? updateTaskMutation.error instanceof Error
                ? updateTaskMutation.error.message
                : "Failed to update task."
              : null
          }
          taskMeta={{
            creatorName: formatPersonName(editingTask.creator),
            subTasks: editingTask.subTasks,
          }}
        />
      ) : null}
    </div>
  );
}
