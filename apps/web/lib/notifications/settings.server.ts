import { prisma } from "@stlvex/database";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  toNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";

const notificationSettingsSelect = {
  enableDiscordPushNotifs: true,
  githubNotifsEnabled: true,
  githubEvents: true,
  fusionNotifsEnabled: true,
} as const;

export async function getNotificationSettings(
  userId: string,
): Promise<NotificationPreferences> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
    select: notificationSettingsSelect,
  });

  if (!settings) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  return toNotificationPreferences(settings);
}

export async function upsertNotificationSettings(
  userId: string,
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const settings = await prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      enableDiscordPushNotifs: preferences.enableDiscordPushNotifs,
      githubNotifsEnabled: preferences.githubNotifsEnabled,
      githubEvents: [...preferences.githubEvents],
      fusionNotifsEnabled: preferences.fusionNotifsEnabled,
    },
    update: {
      enableDiscordPushNotifs: preferences.enableDiscordPushNotifs,
      githubNotifsEnabled: preferences.githubNotifsEnabled,
      githubEvents: [...preferences.githubEvents],
      fusionNotifsEnabled: preferences.fusionNotifsEnabled,
    },
    select: notificationSettingsSelect,
  });

  return toNotificationPreferences(settings);
}
