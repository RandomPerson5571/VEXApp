import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { prisma } from "@stlvex/database";

import type { WebhookContext } from "../context.js";
import type { InventoryLowStockPayload } from "../types/webhook.js";

export const ORDER_PLACED_CUSTOM_ID_PREFIX = "inventory:order-placed:";

export function orderPlacedCustomId(itemId: string): string {
  return `${ORDER_PLACED_CUSTOM_ID_PREFIX}${itemId}`;
}

export function parseOrderPlacedItemId(customId: string): string | null {
  if (!customId.startsWith(ORDER_PLACED_CUSTOM_ID_PREFIX)) return null;
  const itemId = customId.slice(ORDER_PLACED_CUSTOM_ID_PREFIX.length);
  return itemId.length > 0 ? itemId : null;
}

export async function handleInventoryLowStock(
  context: WebhookContext,
  payload: InventoryLowStockPayload,
): Promise<void> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: payload.teamId },
      select: {
        annoucementsChannelId: true,
        purchasingManagerRoleId: true,
        number: true,
      },
    });

    if (!team?.annoucementsChannelId) {
      console.warn(
        `[inventory.low_stock] team ${payload.teamId} has no ops channel`,
      );
      return;
    }

    const channel = await context.client.channels.fetch(team.annoucementsChannelId);
    if (!channel?.isSendable()) {
      console.warn(`[inventory.low_stock] channel not sendable`);
      return;
    }

    const mention = team.purchasingManagerRoleId
      ? `<@&${team.purchasingManagerRoleId}> `
      : "";

    const embed = new EmbedBuilder()
      .setTitle("Low stock")
      .setDescription(
        `**${payload.itemName}** is at **${payload.available}** (threshold ${payload.threshold}).\nMark Order Placed when you've ordered more.`,
      )
      .setColor(0xf59e0b)
      .setTimestamp(new Date())
      .setFooter({ text: `Team ${team.number}` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(orderPlacedCustomId(payload.itemId))
        .setLabel("Order Placed")
        .setStyle(ButtonStyle.Success),
    );

    await channel.send({
      content: `${mention}Low stock alert`.trim(),
      embeds: [embed],
      components: [row],
    });
  } catch (error) {
    console.warn("[inventory.low_stock] failed:", error);
  }
}
