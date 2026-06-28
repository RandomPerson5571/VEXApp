import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { TaskPriority, TaskType } from "@stlvex/database/types";
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  inlineCode,
  time,
  bold,
} from "discord.js";
import type { ChatInputCommandInteraction, ModalSubmitInteraction } from "discord.js";
import type { SlashCommand } from "../../types.js";
import { eventDateFormatHint, parseEventDate } from "../../utils/parse-event-date.js";

const COMMAND_NAME = "create-task";

const taskTypeChoices = [
  { name: "Hardware", value: "Hardware" },
  { name: "Software", value: "Software" },
  { name: "CAD", value: "CAD" },
  { name: "Other", value: "Other" },
] as const satisfies ReadonlyArray<{ name: string; value: TaskType }>;

const taskPriorityChoices = [
  { name: "Low", value: "Low" },
  { name: "Medium", value: "Medium" },
  { name: "High", value: "High" },
] as const satisfies ReadonlyArray<{ name: string; value: TaskPriority }>;

function buildModalCustomId(taskType: TaskType, priority: TaskPriority): string {
  return `${COMMAND_NAME}:${taskType}:${priority}`;
}

function parseModalCustomId(
  customId: string,
): { taskType: TaskType; priority: TaskPriority } | null {
  if (!customId.startsWith(`${COMMAND_NAME}:`)) {
    return null;
  }

  const remainder = customId.slice(COMMAND_NAME.length + 1);
  const separatorIndex = remainder.indexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  return {
    taskType: remainder.slice(0, separatorIndex) as TaskType,
    priority: remainder.slice(separatorIndex + 1) as TaskPriority,
  };
}

const DEFAULT_TASK_TYPE: TaskType = "Other";
const DEFAULT_TASK_PRIORITY: TaskPriority = "Medium";

function buildCreateTaskModal(taskType: TaskType, priority: TaskPriority): ModalBuilder {
  const datePlaceholder = "06/27/2026 14:00";

  return new ModalBuilder()
    .setCustomId(buildModalCustomId(taskType, priority))
    .setTitle("Create Task")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("task-title")
          .setLabel("Title")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("task-description")
          .setLabel("Description")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("task-due-date")
          .setLabel("Due Date & Time (optional)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(datePlaceholder)
          .setRequired(false)
          .setMaxLength(32),
      ),
    );
}

type AuthorizedTeamMember = NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>> & {
  teamId: string;
  team: NonNullable<NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>>["team"]>;
};

async function authorizeTaskCreator(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
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
        "❌ No matching account was found. Ask a team lead/admin to link your Discord ID first.",
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

const createTaskCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription("Create a task for your team")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Task type (optional, defaults to Other)")
        .setRequired(false)
        .addChoices(...taskTypeChoices),
    )
    .addStringOption((option) =>
      option
        .setName("priority")
        .setDescription("Task priority (optional, defaults to Medium)")
        .setRequired(false)
        .addChoices(...taskPriorityChoices),
    ),
  async execute(interaction) {
    const dbUser = await authorizeTaskCreator(interaction);

    if (!dbUser) {
      return;
    }

    const taskType =
      (interaction.options.getString("type") as TaskType | null) ?? DEFAULT_TASK_TYPE;
    const priority =
      (interaction.options.getString("priority") as TaskPriority | null) ?? DEFAULT_TASK_PRIORITY;

    await interaction.showModal(buildCreateTaskModal(taskType, priority));
  },
  async modalSubmit(interaction) {
    const dbUser = await authorizeTaskCreator(interaction);

    if (!dbUser) {
      return;
    }

    const modalData = parseModalCustomId(interaction.customId);

    if (!modalData) {
      await interaction.reply({
        content: "❌ This form is no longer valid. Run `/create-task` again.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const title = interaction.fields.getTextInputValue("task-title").trim();
    const descriptionInput = interaction.fields.getTextInputValue("task-description").trim();
    const dueDateInput = interaction.fields.getTextInputValue("task-due-date").trim();
    const { taskType, priority } = modalData;

    if (!title) {
      await interaction.editReply({ content: "❌ Task title cannot be empty." });
      return;
    }

    if (!descriptionInput) {
      await interaction.editReply({ content: "❌ Task description cannot be empty." });
      return;
    }

    let dueDate: Date | null = null;

    if (dueDateInput) {
      dueDate = parseEventDate(dueDateInput);

      if (!dueDate) {
        await interaction.editReply({
          content: `❌ Invalid due date. Use ${eventDateFormatHint()}.`,
        });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: descriptionInput,
        type: taskType,
        priority,
        dueDate: dueDate ?? undefined,
        teamId: dbUser.teamId,
        createdBy: dbUser.id,
      },
    });

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("✅ Task Created")
      .setDescription(`Created ${bold(task.title)} for team ${inlineCode(dbUser.team.number)}.`)
      .addFields(
        { name: "Type", value: taskType, inline: true },
        { name: "Priority", value: priority, inline: true },
        {
          name: "Due",
          value: dueDate ? `${time(dueDate, "F")} (${time(dueDate, "R")})` : "No due date",
        },
      )
      .setFooter({ text: `Task ID: ${task.id}` })
      .setTimestamp();

    embed.addFields({ name: "Description", value: descriptionInput });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default createTaskCommand;
