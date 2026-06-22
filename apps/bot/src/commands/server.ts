import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../types.js";

const server: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Shows basic info about this server"),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    await interaction.reply(
      `Server: ${interaction.guild.name}\nMembers: ${interaction.guild.memberCount.toLocaleString()}`,
    );
  },
};

export default server;
