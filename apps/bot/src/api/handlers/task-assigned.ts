import { EmbedBuilder } from "discord.js";
import { prisma } from "@stlvex/database";

import type { WebhookContext } from "../context.js";
import type { TaskAssignedPayload } from "../types/webhook.js";

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
    const description = listUrl
      ? `You were assigned: **${payload.title}**\n\n[View task list](${listUrl})`
      : `You were assigned: **${payload.title}**`;

    const embed = new EmbedBuilder()
      .setTitle("Task assigned")
      .setDescription(description)
      .setColor(0x57f287)
      .setTimestamp(new Date())
      .setFooter({ text: `Task ${payload.taskId}` });

    for (const assignee of assignees) {
      const discordId = discordIdForUser(assignee);
      if (!discordId) {
        console.warn(
          `[telemetry] assignee ${assignee.id} has no linked Discord; skip DM`,
        );
        continue;
      }
      await sendTaskAssignmentDm(context.client, discordId, embed);
    }
  } catch (error) {
    console.warn("[task.assigned] failed:", error);
  }
}
