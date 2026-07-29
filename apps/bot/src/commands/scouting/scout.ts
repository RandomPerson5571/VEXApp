import { Prisma, prisma } from "@stlvex/database";
import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  bold,
  inlineCode,
} from "discord.js";
import type { ChatInputCommandInteraction, ModalSubmitInteraction } from "discord.js";
import type { SlashCommand } from "../../types.js";
import { authorizeTeamMember } from "../../utils/authorize-team-member.js";

const COMMAND_NAME = "scout";

function parseRating(raw: string, label: string): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer from 1 to 5.`);
  }
  return value;
}

function buildModal(teamNumber: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${COMMAND_NAME}:${teamNumber}`)
    .setTitle(`Scout ${teamNumber}`.slice(0, 45))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("form-notes")
          .setLabel("Notes")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(1000),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("drive-rating")
          .setLabel("Drive rating (1–5, optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(1),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("auton-rating")
          .setLabel("Auton reliability (1–5, optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(1),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("mechanisms")
          .setLabel("Mechanisms (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(200),
      ),
    );
}

async function authorize(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
) {
  return authorizeTeamMember(interaction);
}

const scoutCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription("Quick-add or update a scouting note by team number")
    .addStringOption((option) =>
      option
        .setName("team-number")
        .setDescription("Opponent team number (e.g. 12345A)")
        .setRequired(true)
        .setMaxLength(16),
    ),
  async execute(interaction) {
    const dbUser = await authorize(interaction);
    if (!dbUser) return;

    const teamNumber = interaction.options
      .getString("team-number", true)
      .trim()
      .toUpperCase();

    if (!teamNumber) {
      await interaction.reply({
        content: "❌ Team number cannot be empty.",
        ephemeral: true,
      });
      return;
    }

    await interaction.showModal(buildModal(teamNumber));
  },
  async modalSubmit(interaction) {
    const dbUser = await authorize(interaction);
    if (!dbUser) return;

    if (!interaction.customId.startsWith(`${COMMAND_NAME}:`)) {
      await interaction.reply({
        content: "❌ This form is no longer valid. Run `/scout` again.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const targetTeamNumber = interaction.customId
      .slice(COMMAND_NAME.length + 1)
      .trim()
      .toUpperCase();
    const formNotes = interaction.fields.getTextInputValue("form-notes").trim();
    const mechanisms = interaction.fields.getTextInputValue("mechanisms").trim();

    let driveRating: number | null | undefined;
    let autonReliability: number | null | undefined;

    try {
      driveRating = parseRating(
        interaction.fields.getTextInputValue("drive-rating"),
        "Drive rating",
      );
      autonReliability = parseRating(
        interaction.fields.getTextInputValue("auton-rating"),
        "Auton reliability",
      );
    } catch (error) {
      await interaction.editReply({
        content: error instanceof Error ? `❌ ${error.message}` : "❌ Invalid rating.",
      });
      return;
    }

    try {
      const note = await prisma.scoutNote.upsert({
        where: {
          teamId_targetTeamNumber: {
            teamId: dbUser.teamId,
            targetTeamNumber,
          },
        },
        create: {
          teamId: dbUser.teamId,
          targetTeamNumber,
          formNotes: formNotes || null,
          mechanisms: mechanisms || null,
          driveRating: driveRating ?? null,
          autonReliability: autonReliability ?? null,
          createdById: dbUser.id,
        },
        update: {
          ...(formNotes ? { formNotes } : {}),
          ...(mechanisms ? { mechanisms } : {}),
          ...(driveRating !== undefined ? { driveRating } : {}),
          ...(autonReliability !== undefined ? { autonReliability } : {}),
        },
      });

      const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        {
          name: "Opponent",
          value: inlineCode(note.targetTeamNumber),
          inline: true,
        },
      ];
      if (note.driveRating != null) {
        fields.push({
          name: "Drive",
          value: `${note.driveRating}/5`,
          inline: true,
        });
      }
      if (note.autonReliability != null) {
        fields.push({
          name: "Auton",
          value: `${note.autonReliability}/5`,
          inline: true,
        });
      }
      if (note.mechanisms) {
        fields.push({ name: "Mechanisms", value: note.mechanisms });
      }
      if (note.formNotes) {
        fields.push({ name: "Notes", value: note.formNotes });
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("📋 Scout note saved")
            .setDescription(
              `Saved scouting for ${bold(note.targetTeamNumber)} (team ${dbUser.team.number}).`,
            )
            .addFields(fields)
            .setTimestamp(),
        ],
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        await interaction.editReply({
          content: "❌ A note for that team already exists and could not be updated.",
        });
        return;
      }

      console.error("Failed to save scout note:", error);
      await interaction.editReply({
        content: "❌ Failed to save scout note. Try again.",
      });
    }
  },
};

export default scoutCommand;
