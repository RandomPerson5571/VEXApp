import { EmbedBuilder, time } from "discord.js";
import { prisma } from "@stlvex/database";
import type { TaskPriority, TaskType } from "@stlvex/database/types";

import type { WebhookContext } from "../context.js";
import type { TaskAssignedPayload } from "../types/webhook.js";

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

function discordIdForUser(user: {
  discordId: string | null;
  discordAccount: { discordId: string } | null;
}): string | null {
  return user.discordId ?? user.discordAccount?.discordId ?? null;
}

function taskListUrl(): string | null {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "");
  return base ? `${base}/task-list` : null;
}

function formatPersonName(person: {
  firstName: string;
  lastName: string;
}): string {
  return `${person.firstName} ${person.lastName}`;
}

function formatOtherAssignees(
  assignments: {
    user: { id: string; firstName: string; lastName: string };
  }[],
  recipientId: string,
): string {
  const others = assignments
    .filter(({ user }) => user.id !== recipientId)
    .map(({ user }) => formatPersonName(user));

  return others.length > 0 ? others.join(", ") : "None";
}

function truncateFieldValue(value: string, max = 1024): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function buildTaskAssignedEmbed(
  task: {
    id: string;
    title: string;
    description: string | null;
    type: TaskType;
    priority: TaskPriority | null;
    dueDate: Date | null;
    assignments: {
      user: { id: string; firstName: string; lastName: string };
    }[];
  },
  recipientId: string,
  listUrl: string | null,
): EmbedBuilder {
  const intro = listUrl
    ? `You were assigned: **${task.title}**\n\n[View task list](${listUrl})`
    : `You were assigned: **${task.title}**`;

  const embed = new EmbedBuilder()
    .setTitle("Task assigned")
    .setDescription(intro)
    .setColor(0x57f287)
    .setTimestamp(new Date())
    .addFields(
      {
        name: "Priority",
        value: task.priority ? PRIORITY_LABELS[task.priority] : "None",
        inline: true,
      },
      { name: "Type", value: TYPE_LABELS[task.type], inline: true },
      {
        name: "Due date",
        value: task.dueDate
          ? `${time(task.dueDate, "F")} (${time(task.dueDate, "R")})`
          : "No due date",
        inline: true,
      },
      {
        name: "Other assignees",
        value: truncateFieldValue(
          formatOtherAssignees(task.assignments, recipientId),
        ),
        inline: false,
      },
    )
    .setFooter({ text: `Task ${task.id}` });

  if (task.description) {
    embed.addFields({
      name: "Description",
      value: truncateFieldValue(task.description),
      inline: false,
    });
  }

  return embed;
}

async function sendTaskAssignmentDm(
  client: import("discord.js").Client,
  discordId: string,
  embed: EmbedBuilder,
): Promise<void> {
  try {
    const user = await client.users.fetch(discordId);
    await user.send({ embeds: [embed] });
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 50007) {
      console.warn(`[telemetry] cannot DM ${discordId}: DMs disabled`);
    } else {
      console.warn(`[telemetry] failed to DM ${discordId}:`, err);
    }
  }
}

export async function handleTaskAssigned(
  context: WebhookContext,
  payload: TaskAssignedPayload,
): Promise<void> {
  if (payload.assigneeUserIds.length === 0) return;

  try {
    const task = await prisma.task.findFirst({
      where: { id: payload.taskId, teamId: payload.teamId },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        priority: true,
        dueDate: true,
        assignments: {
          select: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!task) {
      console.warn(`[task.assigned] task ${payload.taskId} not found`);
      return;
    }

    const assignees = await prisma.user.findMany({
      where: { id: { in: payload.assigneeUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        discordId: true,
        discordAccount: { select: { discordId: true } },
      },
    });

    const listUrl = taskListUrl();

    for (const assignee of assignees) {
      const discordId = discordIdForUser(assignee);
      if (!discordId) {
        console.warn(
          `[telemetry] assignee ${assignee.id} has no linked Discord; skip DM`,
        );
        continue;
      }

      const embed = buildTaskAssignedEmbed(task, assignee.id, listUrl);
      await sendTaskAssignmentDm(context.client, discordId, embed);
    }
  } catch (error) {
    console.warn("[task.assigned] failed:", error);
  }
}
