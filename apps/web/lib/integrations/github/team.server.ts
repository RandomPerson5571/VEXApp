import "server-only";

import { prisma } from "@stlvex/database";

import {
  getRepository,
  parseRepositoryFullName,
} from "@/lib/integrations/github/app.server";

const integrationSelect = {
  id: true,
  teamId: true,
  repositoryId: true,
  repositoryFullName: true,
  repositoryUrl: true,
  webhookId: true,
  installationId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type TeamGitHubIntegrationRecord = {
  id: string;
  teamId: string;
  repositoryId: number | null;
  repositoryFullName: string;
  repositoryUrl: string | null;
  webhookId: string | null;
  installationId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamGitHubIntegrationErrorCode =
  | "NOT_FOUND"
  | "ALREADY_CONNECTED"
  | "INSTALLATION_IN_USE"
  | "INVALID_INPUT"
  | "FORBIDDEN";

export class TeamGitHubIntegrationError extends Error {
  readonly code: TeamGitHubIntegrationErrorCode;

  constructor(message: string, code: TeamGitHubIntegrationErrorCode) {
    super(message);
    this.name = "TeamGitHubIntegrationError";
    this.code = code;
  }
}

type ConnectTeamRepositoryInput = {
  teamId: string;
  userId: string;
  installationId: number;
  repositoryFullName: string;
};

export async function getTeamGitHubIntegration(
  teamId: string,
): Promise<TeamGitHubIntegrationRecord | null> {
  return prisma.teamGitHubIntegration.findUnique({
    where: { teamId },
    select: integrationSelect,
  });
}

export async function connectTeamRepository({
  teamId,
  userId,
  installationId,
  repositoryFullName,
}: ConnectTeamRepositoryInput): Promise<TeamGitHubIntegrationRecord> {
  const member = await prisma.user.findFirst({
    where: { id: userId, teamId },
    select: { id: true },
  });

  if (!member) {
    throw new TeamGitHubIntegrationError(
      "User is not a member of this team.",
      "FORBIDDEN",
    );
  }

  const parsedRepository = parseRepositoryFullName(repositoryFullName);

  if (!parsedRepository) {
    throw new TeamGitHubIntegrationError(
      "Invalid repository full name.",
      "INVALID_INPUT",
    );
  }

  const existing = await prisma.teamGitHubIntegration.findUnique({
    where: { teamId },
    select: { id: true },
  });

  if (existing) {
    throw new TeamGitHubIntegrationError(
      "Team already has a GitHub integration. Disconnect it before connecting a new repository.",
      "ALREADY_CONNECTED",
    );
  }

  const installationInUse = await prisma.teamGitHubIntegration.findFirst({
    where: {
      installationId,
      teamId: { not: teamId },
    },
    select: { teamId: true },
  });

  if (installationInUse) {
    throw new TeamGitHubIntegrationError(
      "This GitHub App installation is already linked to another team.",
      "INSTALLATION_IN_USE",
    );
  }

  const repository = await getRepository(
    installationId,
    parsedRepository.owner,
    parsedRepository.repo,
  );

  if (repository.fullName !== repositoryFullName) {
    throw new TeamGitHubIntegrationError(
      "Repository name mismatch.",
      "INVALID_INPUT",
    );
  }

  return prisma.teamGitHubIntegration.create({
    data: {
      teamId,
      installationId,
      repositoryId: repository.repositoryId,
      repositoryFullName: repository.fullName,
      repositoryUrl: repository.htmlUrl,
      isActive: true,
    },
    select: integrationSelect,
  });
}

export async function disconnectTeamGitHubIntegration(
  teamId: string,
): Promise<boolean> {
  const existing = await prisma.teamGitHubIntegration.findUnique({
    where: { teamId },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.teamGitHubIntegration.delete({
    where: { teamId },
  });

  return true;
}

export async function setTeamGitHubIntegrationActive(
  teamId: string,
  isActive: boolean,
): Promise<TeamGitHubIntegrationRecord> {
  const existing = await prisma.teamGitHubIntegration.findUnique({
    where: { teamId },
    select: { id: true },
  });

  if (!existing) {
    throw new TeamGitHubIntegrationError(
      "No GitHub integration found for this team.",
      "NOT_FOUND",
    );
  }

  return prisma.teamGitHubIntegration.update({
    where: { teamId },
    data: { isActive },
    select: integrationSelect,
  });
}
