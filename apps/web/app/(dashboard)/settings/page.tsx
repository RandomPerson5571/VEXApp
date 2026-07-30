import { prisma } from "@stlvex/database";

import { SettingsView } from "@/components/settings/SettingsView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getNotificationSettings } from "@/lib/notifications/settings.server";

type SettingsPageProps = {
  searchParams: Promise<{
    section?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const user = (await getCurrentUser())!;
  const { profile } = user;

  const [initialNotificationSettings, githubIntegration] = await Promise.all([
    getNotificationSettings(profile.id),
    profile.teamId
      ? prisma.teamGitHubIntegration.findUnique({
          where: { teamId: profile.teamId },
          select: { id: true, isActive: true },
        })
      : Promise.resolve(null),
  ]);
  const githubConnected = Boolean(githubIntegration?.isActive);

  const message =
    params.message === "discord_linked"
      ? "Discord account linked successfully."
      : params.message === "password_updated"
        ? "Your password has been updated."
        : (params.message ?? null);

  const initialSection =
    params.section === "notifications"
      ? "notifications"
      : params.section === "interface"
        ? "interface"
        : "profile";

  return (
    <SettingsView
      firstName={profile.firstName}
      lastName={profile.lastName}
      email={profile.email}
      linkedDiscordId={profile.discordId}
      message={message}
      error={params.error ?? null}
      initialNotificationSettings={initialNotificationSettings}
      githubConnected={githubConnected}
      initialSection={initialSection}
    />
  );
}
