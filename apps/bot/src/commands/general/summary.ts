import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { Prisma, TaskPriority } from "@stlvex/database/types";
import { SlashCommandBuilder, EmbedBuilder, time, bold } from "discord.js";
import type { SlashCommand } from "../../types.js";

const MAX_ITEMS = 8;

const PRIORITY_ORDER: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

type TimeRange = "week" | "month" | "all";

type TaskRow = Prisma.TaskGetPayload<{
  select: {
    title: true;
    status: true;
    priority: true;
    dueDate: true;
    description: true;
  };
}>;

function endDateForRange(range: TimeRange, now: Date): Date | undefined {
  if (range === "week") {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  if (range === "month") {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  return undefined;
}

function sortTasksByUrgency(tasks: TaskRow[]): TaskRow[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      const dueDiff = a.dueDate.getTime() - b.dueDate.getTime();

      if (dueDiff !== 0) {
        return dueDiff;
      }
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }

    const aPriority = a.priority ? PRIORITY_ORDER[a.priority] : PRIORITY_ORDER.Medium;
    const bPriority = b.priority ? PRIORITY_ORDER[b.priority] : PRIORITY_ORDER.Medium;

    return aPriority - bPriority;
  });
}

function formatTaskLine(task: TaskRow): string {
  const priorityLabel = task.priority ? PRIORITY_LABELS[task.priority] : "None";
  const dueLine = task.dueDate
    ? `${time(task.dueDate, "D")} (${time(task.dueDate, "R")})`
    : "*No due date*";
  const statusLabel =
    task.status === "InProgress"
      ? "In Progress"
      : task.status === "NotStarted"
        ? "Not Started"
        : "Done";

  const lines = [
    `${bold("Due:")} ${dueLine}`,
    `${bold("Status:")} ${statusLabel} · ${bold("Priority:")} ${priorityLabel}`,
  ];

  if (task.description) {
    const preview =
      task.description.length > 120
        ? `${task.description.slice(0, 120)}…`
        : task.description;
    lines.push(`${bold("Notes:")} ${preview}`);
  }

  return lines.join("\n");
}

function rangeLabel(range: TimeRange): string {
  if (range === "week") {
    return "Next 7 days";
  }

  if (range === "month") {
    return "Next 30 days";
  }

  return "All upcoming";
}

const summaryCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("summary")
    .setDescription("View a summary of your upcoming tasks and team events")
    .addStringOption((option) =>
      option
        .setName("time-range")
        .setDescription("How far ahead to show events (defaults to week)")
        .setRequired(false)
        .addChoices(
          { name: "Week", value: "week" },
          { name: "Month", value: "month" },
          { name: "All", value: "all" },
        ),
    ),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const range = (interaction.options.getString("time-range") ?? "week") as TimeRange;
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

    const now = new Date();
    const rangeEnd = endDateForRange(range, now);

    const [tasks, events] = await Promise.all([
      prisma.task.findMany({
        where: {
          teamId: dbUser.teamId,
          parentTaskId: null,
          status: { not: "Done" },
          assignments: { some: { userId: dbUser.id } },
        },
        select: {
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          description: true,
        },
      }),
      prisma.event.findMany({
        where: {
          teams: { some: { id: dbUser.teamId } },
          startDate: {
            gte: now,
            ...(rangeEnd ? { lte: rangeEnd } : {}),
          },
        },
        orderBy: { startDate: "asc" },
        select: {
          name: true,
          description: true,
          location: true,
          type: true,
          startDate: true,
          endDate: true,
        },
      }),
    ]);

    const sortedTasks = sortTasksByUrgency(tasks);
    const displayedTasks = sortedTasks.slice(0, MAX_ITEMS);
    const displayedEvents = events.slice(0, MAX_ITEMS);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 Your Summary — Team ${dbUser.team.number}`)
      .setDescription(
        [
          `**Tasks:** incomplete items assigned to you`,
          `**Events:** ${rangeLabel(range)}`,
        ].join("\n"),
      )
      .setTimestamp();

    if (displayedTasks.length === 0) {
      embed.addFields({
        name: "📌 Your Tasks",
        value: "No open tasks assigned to you. You're all caught up!",
      });
    } else {
      displayedTasks.forEach((task, index) => {
        embed.addFields({
          name: `${index + 1}. ${task.title}`,
          value: `${formatTaskLine(task)}\n\u200b`,
        });
      });

      if (sortedTasks.length > MAX_ITEMS) {
        embed.addFields({
          name: "\u200b",
          value: `*+${sortedTasks.length - MAX_ITEMS} more task${sortedTasks.length - MAX_ITEMS === 1 ? "" : "s"}. Use \`/tasks\` for the full list.*`,
        });
      }
    }

    if (displayedEvents.length === 0) {
      embed.addFields({
        name: "📅 Team Events",
        value: `No upcoming events for ${rangeLabel(range).toLowerCase()}.`,
      });
    } else {
      displayedEvents.forEach((event, index) => {
        const when = `${time(event.startDate, "F")} (${time(event.startDate, "R")})`;
        const typeLabel = event.type.replaceAll("_", " ");
        const descriptionLine = event.description
          ? `\n${bold("Details:")} ${event.description.length > 120 ? `${event.description.slice(0, 120)}…` : event.description}`
          : "";

        embed.addFields({
          name: `${index + 1}. ${event.name}`,
          value: [
            `${bold("When:")} ${when}`,
            `${bold("Where:")} ${event.location} · ${bold("Type:")} ${typeLabel}`,
            descriptionLine,
            "\u200b",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      });

      if (events.length > MAX_ITEMS) {
        embed.addFields({
          name: "\u200b",
          value: `*+${events.length - MAX_ITEMS} more event${events.length - MAX_ITEMS === 1 ? "" : "s"}. Use \`/events\` for the full list.*`,
        });
      }
    }

    const footerParts: string[] = [];

    if (sortedTasks.length > 0) {
      footerParts.push(`${sortedTasks.length} task${sortedTasks.length === 1 ? "" : "s"}`);
    }

    if (events.length > 0) {
      footerParts.push(`${events.length} event${events.length === 1 ? "" : "s"}`);
    }

    if (footerParts.length > 0) {
      embed.setFooter({ text: footerParts.join(" · ") });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

export default summaryCommand;
