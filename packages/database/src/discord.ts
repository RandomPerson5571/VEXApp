import { prisma } from "./prisma";

export async function findUserByDiscordId(discordId: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ discordId }, { discordAccount: { discordId } }],
    },
    include: { team: true, discordAccount: true },
  });
}
