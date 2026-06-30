import { findUserByDiscordId, prisma } from "@stlvex/database";
import type { AutocompleteInteraction } from "discord.js";

type DbUser = NonNullable<Awaited<ReturnType<typeof findUserByDiscordId>>>;

export function canManageTeamScopedAction(user: {
  isAdmin: boolean;
  role: string;
}): boolean {
  return user.isAdmin || user.role === "TEAM_LEADER" || user.role === "ADMIN";
}

export function isPlatformAdmin(user: { isAdmin: boolean; role: string }): boolean {
  return user.isAdmin || user.role === "ADMIN";
}

export const ALL_TEAMS_VALUE = "__all__";

function formatTeamChoice(team: { id: string; name: string; number: string }) {
  return {
    name: `${team.name} (${team.number})`.slice(0, 100),
    value: team.id,
  };
}

function matchesAllTeamsQuery(query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    normalized === "all" ||
    normalized.startsWith("all ") ||
    "all teams".startsWith(normalized)
  );
}

export async function autocompleteTeamOption(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name !== "team") {
    await interaction.respond([]);
    return;
  }

  const dbUser = await findUserByDiscordId(interaction.user.id);

  if (!dbUser || !canManageTeamScopedAction(dbUser)) {
    await interaction.respond([]);
    return;
  }

  const query = focused.value.trim();

  if (isPlatformAdmin(dbUser)) {
    const teams = await prisma.team.findMany({
      where: query
        ? {
            OR: [
              { number: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { number: "asc" },
      take: 25,
      select: { id: true, name: true, number: true },
    });

    await interaction.respond(teams.map(formatTeamChoice));
    return;
  }

  if (!dbUser.teamId) {
    await interaction.respond([]);
    return;
  }

  const team = await prisma.team.findUnique({
    where: { id: dbUser.teamId },
    select: { id: true, name: true, number: true },
  });

  if (!team) {
    await interaction.respond([]);
    return;
  }

  const matchesQuery =
    !query ||
    team.number.toLowerCase().includes(query.toLowerCase()) ||
    team.name.toLowerCase().includes(query.toLowerCase());

  await interaction.respond(matchesQuery ? [formatTeamChoice(team)] : []);
}

export async function autocompleteScheduleTeamOption(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name !== "team") {
    await interaction.respond([]);
    return;
  }

  const dbUser = await findUserByDiscordId(interaction.user.id);

  if (!dbUser || !canManageTeamScopedAction(dbUser)) {
    await interaction.respond([]);
    return;
  }

  const query = focused.value.trim();
  const choices: Array<{ name: string; value: string }> = [];

  if (!query || matchesAllTeamsQuery(query)) {
    choices.push({ name: "All Teams", value: ALL_TEAMS_VALUE });
  }

  if (isPlatformAdmin(dbUser)) {
    const teams = await prisma.team.findMany({
      where: query
        ? {
            OR: [
              { number: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { number: "asc" },
      take: 25,
      select: { id: true, name: true, number: true },
    });

    choices.push(...teams.map(formatTeamChoice));
  } else if (dbUser.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: dbUser.teamId },
      select: { id: true, name: true, number: true },
    });

    if (team) {
      const matchesQuery =
        !query ||
        team.number.toLowerCase().includes(query.toLowerCase()) ||
        team.name.toLowerCase().includes(query.toLowerCase());

      if (matchesQuery) {
        choices.push(formatTeamChoice(team));
      }
    }
  }

  await interaction.respond(choices.slice(0, 25));
}

type ResolveTargetTeamResult =
  | { ok: true; teamId: string; teamNumber: string }
  | { ok: false; message: string };

export async function resolveTargetTeam(
  dbUser: DbUser,
  teamIdInput: string | null,
  options: { adminRequiredMessage: string; leaderScopeMessage: string },
): Promise<ResolveTargetTeamResult> {
  if (isPlatformAdmin(dbUser)) {
    if (!teamIdInput) {
      return { ok: false, message: options.adminRequiredMessage };
    }

    const team = await prisma.team.findUnique({
      where: { id: teamIdInput },
      select: { id: true, number: true },
    });

    if (!team) {
      return { ok: false, message: "❌ That team selection is no longer valid. Pick a team again." };
    }

    return { ok: true, teamId: team.id, teamNumber: team.number };
  }

  if (!dbUser.teamId || !dbUser.team) {
    return {
      ok: false,
      message: "⚠️ Your account is missing a team assignment in the database.",
    };
  }

  if (teamIdInput && teamIdInput !== dbUser.teamId) {
    return { ok: false, message: options.leaderScopeMessage };
  }

  return { ok: true, teamId: dbUser.teamId, teamNumber: dbUser.team.number };
}

type ResolveScheduleEventTeamsResult =
  | { ok: true; scope: "all"; teamIds: string[]; teamLabel: string }
  | { ok: true; scope: "single"; teamIds: [string]; teamLabel: string }
  | { ok: false; message: string };

export async function resolveScheduleEventTeams(
  dbUser: DbUser,
  teamIdInput: string | null,
): Promise<ResolveScheduleEventTeamsResult> {
  const wantsAllTeams = !teamIdInput || teamIdInput === ALL_TEAMS_VALUE;

  if (wantsAllTeams) {
    const teams = await prisma.team.findMany({
      select: { id: true, number: true },
      orderBy: { number: "asc" },
    });

    if (teams.length === 0) {
      return { ok: false, message: "❌ No teams found in the database." };
    }

    return {
      ok: true,
      scope: "all",
      teamIds: teams.map((team) => team.id),
      teamLabel: teams.map((team) => team.number).join(", "),
    };
  }

  if (isPlatformAdmin(dbUser)) {
    const team = await prisma.team.findUnique({
      where: { id: teamIdInput },
      select: { id: true, number: true },
    });

    if (!team) {
      return {
        ok: false,
        message: "❌ That team selection is no longer valid. Pick a team again.",
      };
    }

    return {
      ok: true,
      scope: "single",
      teamIds: [team.id],
      teamLabel: team.number,
    };
  }

  if (!dbUser.teamId || !dbUser.team) {
    return {
      ok: false,
      message: "⚠️ Your account is missing a team assignment in the database.",
    };
  }

  if (teamIdInput !== dbUser.teamId) {
    return {
      ok: false,
      message: "❌ Team leaders can only schedule events for their own team.",
    };
  }

  return {
    ok: true,
    scope: "single",
    teamIds: [dbUser.teamId],
    teamLabel: dbUser.team.number,
  };
}
