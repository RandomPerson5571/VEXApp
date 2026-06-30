import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { TaskStatus } from "@stlvex/database/types";
import { EmbedBuilder, SlashCommandBuilder, bold, inlineCode } from "discord.js";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../types.js";

const COMMAND_NAME = "complete-task";

const statusChoices = [
  { name: "Not Started", value: "NotStarted" },
  { name: "In Progress", value: "InProgress" },
  { name: "Done", value: "Done" },
] as const satisfies ReadonlyArray<{ name: string; value: TaskStatus }>;

const statusLabels: Record<TaskStatus, string> = {
  NotStarted: "Not Started",
  InProgress: "In Progress",
  Done: "Done",
};

type AuthorizedTeamMember = NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>> & {
  teamId: string;
  team: NonNullable<NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>>["team"]>;
};

async function authorizeTeamMember(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
): Promise<AuthorizedTeamMember | null> {
  if (!interaction.inGuild() || !interaction.guild) {
    if (interaction.isAutocomplete()) {
      await interaction.respond([]);
      return null;
    }

    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
    return null;
  }

  const dbUser = await findUserByDiscordId(interaction.user.id);

  if (!dbUser) {
    if (interaction.isAutocomplete()) {
      await interaction.respond([]);
      return null;
    }

    await interaction.reply({
      content:
        "❌ No matching account was found. Ask a team lead/admin to link your Discord ID first.",
      ephemeral: true,
    });
    return null;
  }

  if (!dbUser.teamId || !dbUser.team) {
    if (interaction.isAutocomplete()) {
      await interaction.respond([]);
      return null;
    }

    await interaction.reply({
      content: "⚠️ Your account is missing a team assignment in the database.",
      ephemeral: true,
    });
    return null;
  }

  return dbUser as AuthorizedTeamMember;
}

async function autocompleteTeamTaskOption(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name !== "task") {
    await interaction.respond([]);
    return;
  }

  const dbUser = await authorizeTeamMember(interaction);

  if (!dbUser) {
    return;
  }

  const query = focused.value.trim();

  const tasks = await prisma.task.findMany({
    where: {
      teamId: dbUser.teamId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { id: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: { id: true, title: true, status: true },
  });

  await interaction.respond(
    tasks.map((task) => ({
      name: `${task.title} (${statusLabels[task.status]})`.slice(0, 100),
      value: task.id,
    })),
  );
}

const completeTaskCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription("Set a task's progress")
    .addStringOption((option) =>
      option
        .setName("task")
        .setDescription("The task to update")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("New progress status (defaults to Done)")
        .setRequired(false)
        .addChoices(...statusChoices),
    ),
  autocomplete: autocompleteTeamTaskOption,
  async execute(interaction) {
    const dbUser = await authorizeTeamMember(interaction);

    if (!dbUser) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const taskId = interaction.options.getString("task", true);
    const status =
      (interaction.options.getString("status") as TaskStatus | null) ?? "Done";

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        status: true,
        teamId: true,
        type: true,
      },
    });

    if (!task) {
      await interaction.editReply({
        content: "❌ That task was not found. Pick a task from the autocomplete list.",
      });
      return;
    }

    if (task.teamId !== dbUser.teamId) {
      await interaction.editReply({
        content: "❌ You can only update tasks on your own team.",
      });
      return;
    }

    if (task.status === status) {
      await interaction.editReply({
        content: `ℹ️ ${bold(task.title)} is already marked as ${inlineCode(statusLabels[status])}.`,
      });
      return;
    }

    const previousStatus = task.status;

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { status },
      select: { id: true, title: true, status: true, type: true },
    });

    const embed = new EmbedBuilder()
      .setColor(status === "Done" ? 0x57f287 : 0x5865f2)
      .setTitle("✅ Task Updated")
      .setDescription(
        `Updated ${bold(updatedTask.title)} on team ${inlineCode(dbUser.team.number)}.`,
      )
      .addFields(
        {
          name: "Progress",
          value: `${inlineCode(statusLabels[previousStatus])} → ${inlineCode(statusLabels[updatedTask.status])}`,
        },
        { name: "Type", value: updatedTask.type, inline: true },
      )
      .setFooter({ text: `Task ID: ${updatedTask.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default completeTaskCommand;
