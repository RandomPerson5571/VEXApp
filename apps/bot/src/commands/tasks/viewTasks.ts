import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { Prisma, TaskPriority, TaskStatus, TaskType } from "@stlvex/database/types";
import { SlashCommandBuilder, EmbedBuilder, time, bold } from "discord.js";
import type { SlashCommand } from "../../types.js";

const PRIORITY_ORDER: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };
const STATUS_ORDER: Record<TaskStatus, number> = { InProgress: 0, NotStarted: 1, Done: 2 };

const STATUS_LABELS: Record<TaskStatus, string> = {
  NotStarted: "Not Started",
  InProgress: "In Progress",
  Done: "Done",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

const TYPE_LABELS: Record<TaskType, string> = {
  Hardware: "Hardware",
  Software: "Software",
  CAD: "CAD",
  Other: "Other",
};

const MAX_TASKS_IN_EMBED = 25;

type SortField = "priority" | "status" | "due-date" | "created" | "title";
type SortOrder = "asc" | "desc";

type TaskRow = Prisma.TaskGetPayload<{
  include: {
    assignments: {
      include: {
        user: { select: { id: true; firstName: true; lastName: true } };
      };
    };
    _count: { select: { subTasks: true } };
  };
}>;

function formatPersonName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

function formatAssignees(task: TaskRow, currentUserId: string): string {
  if (task.assignments.length === 0) {
    return "*Unassigned*";
  }

  return task.assignments
    .map(({ user }) => {
      const name = formatPersonName(user);
      return user.id === currentUserId ? `${name} *(you)*` : name;
    })
    .join(", ");
}

function compareNullableDates(
  a: Date | null,
  b: Date | null,
  order: SortOrder,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  const diff = a.getTime() - b.getTime();
  return order === "asc" ? diff : -diff;
}

function sortTasks(tasks: TaskRow[], sortBy: SortField, sortOrder: SortOrder): TaskRow[] {
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    let result = 0;

    switch (sortBy) {
      case "priority": {
        const aPriority = a.priority ? PRIORITY_ORDER[a.priority] : PRIORITY_ORDER.Medium;
        const bPriority = b.priority ? PRIORITY_ORDER[b.priority] : PRIORITY_ORDER.Medium;
        result = aPriority - bPriority;
        break;
      }
      case "status":
        result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "due-date":
        return compareNullableDates(a.dueDate, b.dueDate, sortOrder);
      case "created":
        result = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case "title":
        result = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
        break;
    }

    return sortOrder === "asc" ? result : -result;
  });

  return sorted;
}

function buildFilterSummary(options: {
  status: TaskStatus | "ALL" | null;
  priority: TaskPriority | null;
  taskType: TaskType | null;
  assignedToMe: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
}): string {
  const parts: string[] = [];

  if (options.status === null) {
    parts.push("Status: incomplete");
  } else if (options.status === "ALL") {
    parts.push("Status: all");
  } else {
    parts.push(`Status: ${STATUS_LABELS[options.status]}`);
  }

  if (options.priority) {
    parts.push(`Priority: ${PRIORITY_LABELS[options.priority]}`);
  }

  if (options.taskType) {
    parts.push(`Type: ${TYPE_LABELS[options.taskType]}`);
  }

  if (options.assignedToMe) {
    parts.push("Assigned to you");
  }

  const sortLabel =
    options.sortBy === "due-date"
      ? "Due date"
      : options.sortBy === "created"
        ? "Created"
        : options.sortBy.charAt(0).toUpperCase() + options.sortBy.slice(1);

  parts.push(`Sort: ${sortLabel} (${options.sortOrder === "asc" ? "ascending" : "descending"})`);

  return parts.join(" · ");
}

function formatTaskField(task: TaskRow, index: number, currentUserId: string): {
  name: string;
  value: string;
} {
  const statusLabel = STATUS_LABELS[task.status];
  const priorityLabel = task.priority ? PRIORITY_LABELS[task.priority] : "None";
  const dueLine = task.dueDate
    ? `${time(task.dueDate, "D")} (${time(task.dueDate, "R")})`
    : "*No due date*";
  const subtaskLine =
    task._count.subTasks > 0 ? `\n${bold("Subtasks:")} ${task._count.subTasks}` : "";

  return {
    name: `${index + 1}. ${task.title}`,
    value: [
      `${bold("Status:")} ${statusLabel} · ${bold("Priority:")} ${priorityLabel} · ${bold("Type:")} ${TYPE_LABELS[task.type]}`,
      `${bold("Due:")} ${dueLine}`,
      `${bold("Assigned:")} ${formatAssignees(task, currentUserId)}${subtaskLine}`,
      task.description ? `${bold("Notes:")} ${task.description.slice(0, 200)}${task.description.length > 200 ? "…" : ""}` : "",
      "\u200b",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export const data = new SlashCommandBuilder()
  .setName("tasks")
  .setDescription("View your team's tasks")
  .addStringOption((option) =>
    option
      .setName("status")
      .setDescription("Filter by status (defaults to incomplete tasks)")
      .setRequired(false)
      .addChoices(
        { name: "Not Started", value: "NotStarted" },
        { name: "In Progress", value: "InProgress" },
        { name: "Done", value: "Done" },
        { name: "All Statuses", value: "ALL" },
      ),
  )
  .addStringOption((option) =>
    option
      .setName("priority")
      .setDescription("Filter by priority")
      .setRequired(false)
      .addChoices(
        { name: "Low", value: "Low" },
        { name: "Medium", value: "Medium" },
        { name: "High", value: "High" },
      ),
  )
  .addStringOption((option) =>
    option
      .setName("task-type")
      .setDescription("Filter by task type")
      .setRequired(false)
      .addChoices(
        { name: "Hardware", value: "Hardware" },
        { name: "Software", value: "Software" },
        { name: "CAD", value: "CAD" },
        { name: "Other", value: "Other" },
      ),
  )
  .addBooleanOption((option) =>
    option
      .setName("assigned-to-me")
      .setDescription("Only show tasks assigned to you")
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName("sort-by")
      .setDescription("How to sort results (defaults to priority)")
      .setRequired(false)
      .addChoices(
        { name: "Priority", value: "priority" },
        { name: "Status", value: "status" },
        { name: "Due Date", value: "due-date" },
        { name: "Created", value: "created" },
        { name: "Title", value: "title" },
      ),
  )
  .addStringOption((option) =>
    option
      .setName("sort-order")
      .setDescription("Sort direction (defaults to highest priority / soonest due first)")
      .setRequired(false)
      .addChoices(
        { name: "Ascending", value: "asc" },
        { name: "Descending", value: "desc" },
      ),
  );

const tasksCommand: SlashCommand = {
  data,
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const statusInput = interaction.options.getString("status") as TaskStatus | "ALL" | null;
    const priorityFilter = interaction.options.getString("priority") as TaskPriority | null;
    const taskTypeFilter = interaction.options.getString("task-type") as TaskType | null;
    const assignedToMe = interaction.options.getBoolean("assigned-to-me") ?? false;
    const sortBy = (interaction.options.getString("sort-by") ?? "priority") as SortField;
    const sortOrder = (interaction.options.getString("sort-order") ??
      (sortBy === "due-date" || sortBy === "created" || sortBy === "title" ? "asc" : "desc")) as SortOrder;

    const dbUser = await findUserByDiscordId(interaction.user.id);

    if (!dbUser) {
      await interaction.editReply({
        content:
          "❌ No matching account was found. Ask a team lead/admin to link your Discord ID first.",
      });
      return;
    }

    if (!dbUser.teamId || !dbUser.team) {
      await interaction.editReply({
        content: "⚠️ Your account is missing a team assignment in the database.",
      });
      return;
    }

    const where: Prisma.TaskWhereInput = {
      teamId: dbUser.teamId,
      parentTaskId: null,
    };

    if (statusInput === null) {
      where.status = { not: "Done" };
    } else if (statusInput !== "ALL") {
      where.status = statusInput;
    }

    if (priorityFilter) {
      where.priority = priorityFilter;
    }

    if (taskTypeFilter) {
      where.type = taskTypeFilter;
    }

    if (assignedToMe) {
      where.assignments = {
        some: { userId: dbUser.id },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { subTasks: true } },
      },
    });

    const sortedTasks = sortTasks(tasks, sortBy, sortOrder);
    const displayedTasks = sortedTasks.slice(0, MAX_TASKS_IN_EMBED);
    const filterSummary = buildFilterSummary({
      status: statusInput,
      priority: priorityFilter,
      taskType: taskTypeFilter,
      assignedToMe,
      sortBy,
      sortOrder,
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 Team ${dbUser.team.number} Tasks`)
      .setDescription(filterSummary)
      .setTimestamp();

    if (sortedTasks.length === 0) {
      embed.setDescription(`${filterSummary}\n\nNo tasks matched these filters.`);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    displayedTasks.forEach((task, index) => {
      embed.addFields(formatTaskField(task, index, dbUser.id));
    });

    if (sortedTasks.length > MAX_TASKS_IN_EMBED) {
      embed.setFooter({
        text: `Showing ${MAX_TASKS_IN_EMBED} of ${sortedTasks.length} tasks. Refine filters to see more.`,
      });
    } else {
      embed.setFooter({ text: `${sortedTasks.length} task${sortedTasks.length === 1 ? "" : "s"}` });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

export default tasksCommand;
