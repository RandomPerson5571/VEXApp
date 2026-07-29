import { findUserByDiscordId } from "@stlvex/database";
import type { ChatInputCommandInteraction, ModalSubmitInteraction } from "discord.js";

type DbUser = NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>>;

export type AuthorizedTeamMember = DbUser & {
  teamId: string;
  team: NonNullable<DbUser["team"]>;
};

type AuthInteraction = ChatInputCommandInteraction | ModalSubmitInteraction;

/** Guild + linked Discord user + team assignment. Replies on failure. */
export async function authorizeTeamMember(
  interaction: AuthInteraction,
): Promise<AuthorizedTeamMember | null> {
  if (!interaction.inGuild() || !interaction.guild) {
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
        "❌ No matching account was found. Link Discord in settings: stlvexapp.guanine.org/settings/profile",
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

  if (!dbUser.teamId || !dbUser.team) {
    await interaction.reply({
      content: "⚠️ Your account is missing a team assignment in the database.",
      ephemeral: true,
    });
    return null;
  }

  return dbUser as AuthorizedTeamMember;
}

export function todayUtcDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function todayUtcDateString(): string {
  return todayUtcDate().toISOString().slice(0, 10);
}
