import { EmbedBuilder, SlashCommandBuilder, inlineCode } from "discord.js";
import type { SlashCommand } from "../../types.js";

/** Member-facing commands only — no leader/admin/moderation. */
const MEMBER_COMMANDS: { name: string; description: string }[] = [
  { name: "help", description: "Show this list" },
  { name: "ping", description: "Check that the bot is online" },
  { name: "server", description: "Show basic info about this server" },
  { name: "team", description: "Look up your team (or another member's)" },
  { name: "verify", description: "Verify yourself and sync your nickname" },
  { name: "day-plan", description: "See today's plan for your team" },
  { name: "summary", description: "Overview of upcoming tasks and events" },
  { name: "events", description: "List upcoming team events" },
  { name: "tasks", description: "View your team's tasks" },
  { name: "create-task", description: "Create a task for your team" },
  { name: "complete-task", description: "Update a task's progress" },
  { name: "scout", description: "Add or update a scouting note" },
];

const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List basic member commands"),
  async execute(interaction) {
    const lines = MEMBER_COMMANDS.map(
      (command) =>
        `${inlineCode(`/${command.name}`)} — ${command.description}`,
    ).join("\n");

    const embed = new EmbedBuilder()
      .setTitle("Member commands")
      .setDescription(lines)
      .setFooter({
        text: "Link your Discord account and join a team to use most of these.",
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default helpCommand;
