import "server-only";

import { prisma } from "@stlvex/database";

import {
  createProjectWebhook,
  deleteProjectWebhook,
  getFusionProjectDetails,
  isValidFusionFolderUrn,
} from "@/lib/integrations/fusion/app.server";

const integrationSelect = {
  id: true,
  teamId: true,
  projectUrn: true,
  projectName: true,
  hookId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type TeamFusionIntegrationRecord = {
  id: string;
  teamId: string;
  projectUrn: string;
  projectName: string | null;
  hookId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamFusionIntegrationErrorCode =
  | "NOT_FOUND"
  | "ALREADY_CONNECTED"
  | "PROJECT_IN_USE"
  | "INVALID_INPUT"
  | "FORBIDDEN";

export class TeamFusionIntegrationError extends Error {
  readonly code: TeamFusionIntegrationErrorCode;

  constructor(message: string, code: TeamFusionIntegrationErrorCode) {
    super(message);
    this.name = "TeamFusionIntegrationError";
    this.code = code;
  }
}

type ConnectTeamFusionProjectInput = {
  teamId: string;
  userId: string;
  accessToken: string;
  projectUrn: string;
  projectName: string | null;
};

export async function getTeamFusionIntegration(
  teamId: string,
): Promise<TeamFusionIntegrationRecord | null> {
  return prisma.teamFusionIntegration.findUnique({
    where: { teamId },
    select: integrationSelect,
  });
}

export async function connectTeamFusionProject({
  teamId,
  userId,
  accessToken,
  projectUrn,
  projectName,
}: ConnectTeamFusionProjectInput): Promise<TeamFusionIntegrationRecord> {
  const member = await prisma.user.findFirst({
    where: { id: userId, teamId },
    select: { id: true },
  });

  if (!member) {
    throw new TeamFusionIntegrationError(
      "User is not a member of this team.",
      "FORBIDDEN",
    );
  }

  const normalizedUrn = projectUrn.trim();

  if (!isValidFusionFolderUrn(normalizedUrn)) {
    throw new TeamFusionIntegrationError(
      "Invalid Fusion project URN.",
      "INVALID_INPUT",
    );
  }

  const existing = await prisma.teamFusionIntegration.findUnique({
    where: { teamId },
    select: { id: true },
  });

  if (existing) {
    throw new TeamFusionIntegrationError(
      "Team already has a Fusion integration. Disconnect it before connecting a new project.",
      "ALREADY_CONNECTED",
    );
  }

  const projectInUse = await prisma.teamFusionIntegration.findFirst({
    where: {
      projectUrn: normalizedUrn,
      teamId: { not: teamId },
    },
    select: { teamId: true },
  });

  if (projectInUse) {
    throw new TeamFusionIntegrationError(
      "This Fusion project is already linked to another team.",
      "PROJECT_IN_USE",
    );
  }

  const project = await getFusionProjectDetails(
    accessToken,
    normalizedUrn,
    projectName,
  );

  if (project.folderUrn !== normalizedUrn) {
    throw new TeamFusionIntegrationError(
      "Fusion project URN mismatch.",
      "INVALID_INPUT",
    );
  }

  const hookId = await createProjectWebhook(accessToken, project.folderUrn);

  return prisma.teamFusionIntegration.create({
    data: {
      teamId,
      projectUrn: project.folderUrn,
      projectName: project.projectName,
      hookId,
      isActive: true,
    },
    select: integrationSelect,
  });
}

export async function disconnectTeamFusionIntegration(
  teamId: string,
): Promise<boolean> {
  const existing = await prisma.teamFusionIntegration.findUnique({
    where: { teamId },
    select: { id: true, hookId: true },
  });

  if (!existing) {
    return false;
  }

  if (existing.hookId) {
    try {
      await deleteProjectWebhook(existing.hookId);
    } catch {
      // ponytail: still remove local link if APS hook delete fails
    }
  }

  await prisma.teamFusionIntegration.delete({
    where: { teamId },
  });

  return true;
}

export async function setTeamFusionIntegrationActive(
  teamId: string,
  isActive: boolean,
): Promise<TeamFusionIntegrationRecord> {
  const existing = await prisma.teamFusionIntegration.findUnique({
    where: { teamId },
    select: { id: true },
  });

  if (!existing) {
    throw new TeamFusionIntegrationError(
      "No Fusion integration found for this team.",
      "NOT_FOUND",
    );
  }

  return prisma.teamFusionIntegration.update({
    where: { teamId },
    data: { isActive },
    select: integrationSelect,
  });
}
