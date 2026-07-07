import { prisma } from "./prisma";

export async function findTeamFusionIntegrationByProjectUrn(projectUrn: string) {
  return prisma.teamFusionIntegration.findFirst({
    where: {
      projectUrn,
      isActive: true,
    },
    include: { team: true },
  });
}

export async function findFusionNotificationRecipients(teamId: string) {
  return prisma.user.findMany({
    where: {
      teamId,
      OR: [
        { discordId: { not: null } },
        { discordAccount: { isNot: null } },
      ],
      notificationSettings: {
        enableDiscordPushNotifs: true,
        fusionNotifsEnabled: true,
      },
    },
    include: { discordAccount: true, notificationSettings: true },
  });
}
