import { prisma } from "@stlvex/database";

export function hasTestDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export const TEST_AUTH_USER_A = "00000000-0000-4000-8000-0000000000a1";
export const TEST_AUTH_USER_B = "00000000-0000-4000-8000-0000000000b1";

type TestInviteOverrides = {
  maxUses?: number;
  usesCount?: number;
  expiresAt?: Date;
  reservedByUserId?: string | null;
  reservedAt?: Date | null;
};

export async function createTestTeam() {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return prisma.team.create({
    data: {
      name: `Vitest Team ${suffix}`,
      number: `VIT${suffix}`,
    },
  });
}

export async function createTestInvite(
  teamId: string,
  overrides: TestInviteOverrides = {},
) {
  const id = `vitest-${crypto.randomUUID()}`;

  return prisma.invite.create({
    data: {
      id,
      teamId,
      maxUses: overrides.maxUses ?? 1,
      usesCount: overrides.usesCount ?? 0,
      expiresAt:
        overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reservedByUserId: overrides.reservedByUserId ?? null,
      reservedAt: overrides.reservedAt ?? null,
    },
  });
}

export async function deleteTestInvite(inviteId: string) {
  await prisma.invite.deleteMany({ where: { id: inviteId } });
}

export async function deleteTestTeam(teamId: string) {
  await prisma.invite.deleteMany({ where: { teamId } });
  await prisma.team.deleteMany({ where: { id: teamId } });
}
