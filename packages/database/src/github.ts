import { prisma } from "./prisma";

export async function findTeamGitHubIntegrationByRepo(fullName: string) {
  return prisma.teamGitHubIntegration.findFirst({
    where: {
      repositoryFullName: fullName,
      isActive: true,
    },
    include: { team: true },
  });
}

export async function findGitHubNotificationRecipients(
  teamId: string,
  eventType: string,
) {
  return prisma.user.findMany({
    where: {
      teamId,
      OR: [
        { discordId: { not: null } },
        { discordAccount: { isNot: null } },
      ],
      notificationSettings: {
        enableDiscordPushNotifs: true,
        githubNotifsEnabled: true,
        githubEvents: { has: eventType },
      },
    },
    include: { discordAccount: true, notificationSettings: true },
  });
}
