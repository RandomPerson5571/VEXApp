import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { EventType } from "@stlvex/database/types";
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
import {
  autocompleteScheduleTeamOption,
  canManageTeamScopedAction,
  resolveScheduleEventTeams,
} from "../../utils/team-options.js";

const COMMAND_NAME = "schedule-events";

const eventTypeChoices = [
  { name: "Work Session", value: "WORK_SESSION" },
  { name: "Lesson", value: "LESSON" },
  { name: "Tournament", value: "TOURNAMENT" },
  { name: "Check In", value: "CHECK_IN" },
] as const satisfies ReadonlyArray<{ name: string; value: EventType }>;

function buildModalCustomId(eventType: EventType, teamId: string | null): string {
  return `${COMMAND_NAME}:${eventType}:${teamId ?? ""}`;
}

function parseModalCustomId(
  customId: string,
): { eventType: EventType; teamId: string | null } | null {
  if (!customId.startsWith(`${COMMAND_NAME}:`)) {
    return null;
  }

  const remainder = customId.slice(COMMAND_NAME.length + 1);
  const separatorIndex = remainder.indexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  const eventType = remainder.slice(0, separatorIndex) as EventType;
  const teamPart = remainder.slice(separatorIndex + 1);

  return {
    eventType,
    teamId: teamPart || null,
  };
}

function buildScheduleEventModal(eventType: EventType, teamId: string | null): ModalBuilder {
  const datePlaceholder = "06/27/2026 14:00";

  return new ModalBuilder()
    .setCustomId(buildModalCustomId(eventType, teamId))
    .setTitle("Schedule Event")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("event-name")
          .setLabel("Event Name")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("event-description")
          .setLabel("Description")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("event-location")
          .setLabel("Location")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("event-start-date")
          .setLabel("Start Date & Time")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(datePlaceholder)
          .setRequired(true)
          .setMaxLength(32),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("event-end-date")
          .setLabel("End Date & Time (optional)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(datePlaceholder)
          .setRequired(false)
          .setMaxLength(32),
      ),
    );
}

async function authorizeScheduler(interaction: ChatInputCommandInteraction | ModalSubmitInteraction) {
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

  if (!canManageTeamScopedAction(dbUser)) {
    await interaction.reply({
      content: "❌ Only admins and team leaders can schedule events.",
      ephemeral: true,
    });
    return null;
  }

  return dbUser;
}

const scheduleEventsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription("Schedule an event for a team")
    .addStringOption((option) =>
      option
        .setName("event-type")
        .setDescription("The type of the event")
        .setRequired(true)
        .addChoices(...eventTypeChoices),
    )
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("Team to schedule for (defaults to all teams)")
        .setRequired(false)
        .setAutocomplete(true),
    ),
  autocomplete: autocompleteScheduleTeamOption,
  async execute(interaction) {
    const dbUser = await authorizeScheduler(interaction);

    if (!dbUser) {
      return;
    }

    const eventType = interaction.options.getString("event-type", true) as EventType;
    const teamId = interaction.options.getString("team");

    await interaction.showModal(buildScheduleEventModal(eventType, teamId));
  },
  async modalSubmit(interaction) {
    const dbUser = await authorizeScheduler(interaction);

    if (!dbUser) {
      return;
    }

    const modalData = parseModalCustomId(interaction.customId);

    if (!modalData) {
      await interaction.reply({
        content: "❌ This form is no longer valid. Run `/schedule-events` again.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const eventName = interaction.fields.getTextInputValue("event-name");
    const eventDescription = interaction.fields.getTextInputValue("event-description");
    const eventLocation = interaction.fields.getTextInputValue("event-location");
    const startDateInput = interaction.fields.getTextInputValue("event-start-date");
    const endDateInput = interaction.fields.getTextInputValue("event-end-date");
    const { eventType, teamId } = modalData;

    const startDate = parseEventDate(startDateInput);

    if (!startDate) {
      await interaction.editReply({
        content: `❌ Invalid start date. Use ${eventDateFormatHint()}.`,
      });
      return;
    }

    let endDate: Date;

    if (endDateInput.trim()) {
      const parsedEndDate = parseEventDate(endDateInput);

      if (!parsedEndDate) {
        await interaction.editReply({
          content: `❌ Invalid end date. Use ${eventDateFormatHint()}.`,
        });
        return;
      }

      endDate = parsedEndDate;
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    if (endDate <= startDate) {
      await interaction.editReply({
        content: "❌ End date must be after the start date.",
      });
      return;
    }

    const targetTeams = await resolveScheduleEventTeams(dbUser, teamId);

    if (!targetTeams.ok) {
      await interaction.editReply({ content: targetTeams.message });
      return;
    }

    const event = await prisma.event.create({
      data: {
        name: eventName,
        description: eventDescription,
        location: eventLocation,
        type: eventType,
        startDate,
        endDate,
        teams: {
          connect: targetTeams.teamIds.map((id) => ({ id })),
        },
      },
    });

    const teamSummary =
      targetTeams.scope === "all"
        ? `all teams (${inlineCode(targetTeams.teamLabel)})`
        : `team ${inlineCode(targetTeams.teamLabel)}`;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("✅ Event Scheduled")
      .setDescription(`Created ${bold(event.name)} for ${teamSummary}.`)
      .addFields(
        {
          name: "When",
          value: `${time(startDate, "F")} → ${time(endDate, "T")} (${time(startDate, "R")})`,
        },
        { name: "Location", value: eventLocation, inline: true },
        { name: "Type", value: eventType.replaceAll("_", " "), inline: true },
        { name: "Description", value: eventDescription },
      )
      .setFooter({ text: `Event ID: ${event.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default scheduleEventsCommand;
