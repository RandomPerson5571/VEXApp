import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { ButtonInteraction } from "discord.js";

import {
  parseOrderPlacedItemId,
} from "../api/handlers/inventory-low-stock.js";
import { isPlatformAdmin } from "../utils/team-options.js";

export async function handleInventoryOrderPlacedButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const itemId = parseOrderPlacedItemId(interaction.customId);
  if (!itemId) return;

  await interaction.deferUpdate();

  const dbUser = await findUserByDiscordId(interaction.user.id);
  if (!dbUser) {
    await interaction.followUp({
      content: "Link your Discord account in the web app first.",
      ephemeral: true,
    });
    return;
  }

  const canAck =
    isPlatformAdmin(dbUser) ||
    dbUser.role === "TEAM_LEADER" ||
    dbUser.role === "ADMIN";

  if (!canAck) {
    await interaction.followUp({
      content: "Only team leaders or admins can mark Order Placed.",
      ephemeral: true,
    });
    return;
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    select: { id: true, name: true },
  });

  if (!item) {
    await interaction.followUp({
      content: "That inventory item no longer exists.",
      ephemeral: true,
    });
    return;
  }

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      orderPlacedAt: new Date(),
      restockPending: true,
    },
  });

  const embed = interaction.message.embeds[0];
  await interaction.editReply({
    content: interaction.message.content,
    embeds: embed
      ? [
          {
            ...embed.toJSON(),
            description: `${embed.description ?? ""}\n\n✅ **Order placed** by <@${interaction.user.id}>`,
            color: 0x16a34a,
          },
        ]
      : [],
    components: [],
  });
}
