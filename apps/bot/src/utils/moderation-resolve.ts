import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { ChatInputCommandInteraction, User as DiscordUser } from "discord.js";

type DbUser = NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>>;

export async function resolveActor(
  interaction: ChatInputCommandInteraction,
): Promise<DbUser | null> {
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
    return null;
  }

  const dbUser = await findUserByDiscordId(interaction.user.id);
  if (!dbUser) {
    await interaction.reply({
      content:
        "❌ No matching account was found. Link Discord in settings first.",
      ephemeral: true,
    });
    return null;
  }

  if (dbUser.bannedAt) {
    await interaction.reply({
      content: "❌ Your account has been banned.",
      ephemeral: true,
    });
    return null;
  }

  return dbUser;
}

export async function resolveTargetFromUserOption(
  interaction: ChatInputCommandInteraction,
  optionName = "user",
): Promise<{ discordUser: DiscordUser; dbUser: DbUser } | null> {
  const discordUser = interaction.options.getUser(optionName, true);
  const dbUser = await findUserByDiscordId(discordUser.id);

  if (!dbUser) {
    await interaction.editReply({
      content: "❌ That Discord user is not linked to a platform account.",
    });
    return null;
  }

  return { discordUser, dbUser };
}

/**
 * Resolve ban/unban target: Discord user OR platform user_id OR discord_id string.
 * Exactly one identifier source required.
 */
export async function resolveBanTarget(
  interaction: ChatInputCommandInteraction,
): Promise<DbUser | null> {
  const discordUser = interaction.options.getUser("user");
  const userId = interaction.options.getString("user_id")?.trim() || null;
  const discordId = interaction.options.getString("discord_id")?.trim() || null;

  const provided = [discordUser ? 1 : 0, userId ? 1 : 0, discordId ? 1 : 0].reduce(
    (a, b) => a + b,
    0,
  );

  if (provided !== 1) {
    await interaction.editReply({
      content:
        "❌ Provide exactly one of: `user`, `user_id`, or `discord_id`.",
    });
    return null;
  }

  if (discordUser) {
    const dbUser = await findUserByDiscordId(discordUser.id);
    if (!dbUser) {
      await interaction.editReply({
        content: "❌ That Discord user is not linked to a platform account.",
      });
      return null;
    }
    return dbUser;
  }

  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true, discordAccount: true },
    });
    if (!dbUser) {
      await interaction.editReply({
        content: "❌ No platform user found for that `user_id`.",
      });
      return null;
    }
    return dbUser;
  }

  const dbUser = await findUserByDiscordId(discordId!);
  if (!dbUser) {
    await interaction.editReply({
      content: "❌ No platform user found for that `discord_id`.",
    });
    return null;
  }
  return dbUser;
}

export function formatModerationError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Action failed.";
  if (message === "Forbidden.") {
    return "❌ You are not allowed to moderate that user.";
  }
  return `❌ ${message}`;
}
