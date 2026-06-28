import { findUserByDiscordId } from "@stlvex/database";
import { SlashCommandBuilder } from "discord.js";
import { config } from "../config.js";
import type { SlashCommand } from "../types.js";

const verify: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify yourself and sync your nickname from the database"),
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const discordId = interaction.user.id;

    const user = await findUserByDiscordId(discordId);

    if (!user) {
      await interaction.reply({
        content: "No matching account was found. Please link your discord account first.",
        ephemeral: true,
      });
      return;
    }

    if (!user.team) {
      await interaction.reply({
        content: "Your account is missing a team assignment in the database.",
        ephemeral: true,
      });
      return;
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const nickname = `${fullName} | ${user.team.number}`.slice(0, 32);

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.setNickname(nickname, "Verified user sync");
      if (!user.team.discordRoleId) {
        throw new Error("Missing Discord role ID for the user's team");
      }

      await member.roles.add(user.team.discordRoleId, "Verified user sync");
      await member.roles.add(config.generalMemberRoleId, "Verified user sync");

      await interaction.reply({
        content: `Verified. Your nickname is now: ${nickname}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Failed to update nickname during verify:", error);

      await interaction.reply({
        content:
          `Verified in database, but I could not update your nickname. ` +
          `Make sure the bot has Manage Nicknames permission and a higher role than your member role. ` +
          `Expected nickname: ${nickname}`,
        ephemeral: true,
      });
    }
  },
};

export default verify;
