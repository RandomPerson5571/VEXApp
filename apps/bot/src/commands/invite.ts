import { randomUUID } from "node:crypto";
import { findUserByDiscordId, prisma } from "@stlvex/database";
import { SlashCommandBuilder, EmbedBuilder, inlineCode, time, bold } from "discord.js";
import type { SlashCommand } from "../types.js";
import {
  autocompleteTeamOption,
  canManageTeamScopedAction,
  resolveTargetTeam,
} from "../utils/team-options.js";

function parseEventDate(value: string): Date | null {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

const inviteUsersCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("invite-users")
    .setDescription("Create an invite link for users to join a team")
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("Team to invite users to (required for admins; leaders default to their own)")
        .setRequired(false)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("expiry-date")
        .setDescription("Expiry date/time (ISO 8601). Defaults to one week from now.")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("max-uses")
        .setDescription("Maximum number of uses. Defaults to 1.")
        .setRequired(false)
        .setMinValue(1),
    ),
  autocomplete: autocompleteTeamOption,
  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const dbUser = await findUserByDiscordId(interaction.user.id);

    if (!dbUser) {
      await interaction.editReply({
        content:
          "❌ No matching account was found. Ask a team lead/admin to link your Discord ID first.",
      });
      return;
    }

    if (!canManageTeamScopedAction(dbUser)) {
      await interaction.editReply({
        content: "❌ Only admins and team leaders can create team invites.",
      });
      return;
    }

    const teamIdInput = interaction.options.getString("team");
    const expiryDateInput = interaction.options.getString("expiry-date");
    const maxUses = interaction.options.getInteger("max-uses") ?? 1;

    const targetTeam = await resolveTargetTeam(dbUser, teamIdInput, {
      adminRequiredMessage: "❌ Admins must select a team when creating an invite.",
      leaderScopeMessage: "❌ Team leaders can only create invites for their own team.",
    });

    if (!targetTeam.ok) {
      await interaction.editReply({ content: targetTeam.message });
      return;
    }

    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (expiryDateInput) {
      const parsedExpiry = parseEventDate(expiryDateInput);

      if (!parsedExpiry) {
        await interaction.editReply({
          content:
            "❌ Invalid expiry date. Use an ISO 8601 timestamp, e.g. `2026-07-04T14:00:00`.",
        });
        return;
      }

      if (parsedExpiry <= new Date()) {
        await interaction.editReply({
          content: "❌ Expiry date must be in the future.",
        });
        return;
      }

      expiresAt = parsedExpiry;
    }

    const invite = await prisma.invite.create({
      data: {
        id: randomUUID(),
        expiresAt,
        maxUses,
        teamId: targetTeam.teamId,
      },
    });

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("✅ Invite Created")
      .setDescription(`Created invite ${bold(invite.id)} for team ${inlineCode(targetTeam.teamNumber)}.`)
      .addFields(
        {
          name: "Expires",
          value: `${time(expiresAt, "F")} (${time(expiresAt, "R")})`,
        },
        { name: "Max Uses", value: maxUses.toString(), inline: true },
      )
      .setFooter({ text: `Invite ID: ${invite.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default inviteUsersCommand;
