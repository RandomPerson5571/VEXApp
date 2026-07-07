import { prisma } from "../../src/prisma.js";
import type {
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole,
} from "../../generated/prisma/index.js";

export function hasTestDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function hasDayPlansTable(): Promise<boolean> {
  if (!hasTestDatabase()) {
    return false;
  }

  try {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'team_day_plans'
      ) AS "exists"
    `;
    return result[0]?.exists ?? false;
  } catch {
    return false;
  }
}

export const TEST_AUTH_USER_A = "00000000-0000-4000-8000-0000000000a1";
export const TEST_AUTH_USER_B = "00000000-0000-4000-8000-0000000000b1";

type TestTeamOverrides = {
  name?: string;
  number?: string;
  discordServerId?: string | null;
  discordRoleId?: string | null;
};

type TestInviteOverrides = {
  maxUses?: number;
  usesCount?: number;
  expiresAt?: Date;
  reservedByUserId?: string | null;
  reservedAt?: Date | null;
};

type TestUserInput = {
  id?: string;
  role?: UserRole;
  isAdmin?: boolean;
  discordId?: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  withDiscordAccount?: boolean;
  discordUsername?: string;
};

type TestNotificationSettingsInput = {
  githubEvents?: string[];
  githubNotifsEnabled?: boolean;
  fusionNotifsEnabled?: boolean;
  enableDiscordPushNotifs?: boolean;
};

type TestGitHubIntegrationInput = {
  repositoryFullName?: string;
  isActive?: boolean;
  installationId?: number | null;
  repositoryId?: number | null;
  repositoryUrl?: string | null;
};

type TestFusionIntegrationInput = {
  projectUrn?: string;
  projectName?: string | null;
  isActive?: boolean;
  hookId?: string | null;
};

type TestTaskOverrides = {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  dueDate?: Date | null;
};

export async function createTestTeam(overrides: TestTeamOverrides = {}) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  return prisma.team.create({
    data: {
      name: overrides.name ?? `Vitest Team ${suffix}`,
      number: overrides.number ?? `VIT${suffix}`,
      ...(overrides.discordServerId !== undefined && {
        discordServerId: overrides.discordServerId,
      }),
      ...(overrides.discordRoleId !== undefined && {
        discordRoleId: overrides.discordRoleId,
      }),
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
      reservedAt:
        overrides.reservedAt ??
        (overrides.reservedByUserId ? new Date() : null),
    },
  });
}

export async function createTestUser(
  teamId: string,
  input: TestUserInput = {},
) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const userId = input.id ?? `vitest-user-${suffix}`;
  const discordId =
    input.discordId !== undefined ? input.discordId : `discord-${suffix}`;
  const accountDiscordId =
    discordId ?? (input.withDiscordAccount ? `discord-acct-${suffix}` : null);

  return prisma.user.create({
    data: {
      id: userId,
      email: input.email ?? `vitest-${suffix}@example.com`,
      firstName: input.firstName ?? "Vitest",
      lastName: input.lastName ?? "User",
      teamId,
      role: input.role ?? "TEAM_MEMBER",
      isAdmin: input.isAdmin ?? false,
      discordId,
      verificationMethod: "EMAIL",
      isVerified: true,
      notificationSettings: {
        create: {},
      },
      ...(input.withDiscordAccount && accountDiscordId
        ? {
            discordAccount: {
              create: {
                discordId: accountDiscordId,
                discordUsername: input.discordUsername ?? "vitest_user",
              },
            },
          }
        : {}),
    },
    include: { notificationSettings: true, discordAccount: true },
  });
}

export async function createTestNotificationSettings(
  userId: string,
  overrides: TestNotificationSettingsInput = {},
) {
  return prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      enableDiscordPushNotifs: overrides.enableDiscordPushNotifs ?? true,
      githubNotifsEnabled: overrides.githubNotifsEnabled ?? false,
      githubEvents: overrides.githubEvents ?? ["push", "pull_request"],
      fusionNotifsEnabled: overrides.fusionNotifsEnabled ?? false,
    },
    update: {
      ...(overrides.enableDiscordPushNotifs !== undefined && {
        enableDiscordPushNotifs: overrides.enableDiscordPushNotifs,
      }),
      ...(overrides.githubNotifsEnabled !== undefined && {
        githubNotifsEnabled: overrides.githubNotifsEnabled,
      }),
      ...(overrides.githubEvents !== undefined && {
        githubEvents: overrides.githubEvents,
      }),
      ...(overrides.fusionNotifsEnabled !== undefined && {
        fusionNotifsEnabled: overrides.fusionNotifsEnabled,
      }),
    },
  });
}

export async function createTestGitHubIntegration(
  teamId: string,
  overrides: TestGitHubIntegrationInput = {},
) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);

  return prisma.teamGitHubIntegration.create({
    data: {
      teamId,
      repositoryFullName:
        overrides.repositoryFullName ?? `vitest-org/repo-${suffix}`,
      installationId: overrides.installationId ?? 12345,
      repositoryId: overrides.repositoryId ?? 999,
      repositoryUrl:
        overrides.repositoryUrl ??
        `https://github.com/vitest-org/repo-${suffix}`,
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function createTestFusionIntegration(
  teamId: string,
  overrides: TestFusionIntegrationInput = {},
) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);

  return prisma.teamFusionIntegration.create({
    data: {
      teamId,
      projectUrn: overrides.projectUrn ?? `urn:adsk.wipprod:fs.folder:co.${suffix}`,
      projectName: overrides.projectName ?? `Vitest Project ${suffix}`,
      hookId: overrides.hookId ?? null,
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function createTestTask(
  teamId: string,
  createdBy: string,
  overrides: TestTaskOverrides = {},
) {
  return prisma.task.create({
    data: {
      title: overrides.title ?? "Vitest task",
      description: overrides.description ?? "Integration test task",
      type: overrides.type ?? "Software",
      status: overrides.status ?? "NotStarted",
      priority: overrides.priority ?? "Medium",
      dueDate: overrides.dueDate ?? undefined,
      teamId,
      createdBy,
    },
  });
}

export async function deleteTestInvite(inviteId: string) {
  await prisma.invite.deleteMany({ where: { id: inviteId } });
}

export async function deleteTestUser(userId: string) {
  await prisma.taskAssignment.deleteMany({ where: { userId } });
  await prisma.notificationSettings.deleteMany({ where: { userId } });
  await prisma.discordAccount.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

export async function deleteTestTeam(teamId: string) {
  await prisma.taskAssignment.deleteMany({
    where: { task: { teamId } },
  });
  await prisma.task.deleteMany({ where: { teamId } });
  await prisma.notebookLog.deleteMany({ where: { teamId } });
  await prisma.inventoryItemSignOut.deleteMany({ where: { teamId } });

  const users = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });

  for (const user of users) {
    await deleteTestUser(user.id);
  }

  await prisma.teamGitHubIntegration.deleteMany({ where: { teamId } });
  await prisma.teamFusionIntegration.deleteMany({ where: { teamId } });
  await prisma.invite.deleteMany({ where: { teamId } });

  await prisma.event.deleteMany({
    where: { teams: { some: { id: teamId } } },
  });

  await prisma.team.deleteMany({ where: { id: teamId } });
}
