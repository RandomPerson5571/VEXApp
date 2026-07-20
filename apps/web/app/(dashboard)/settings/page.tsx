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
  const { profile, team } = user;

  const initialNotificationSettings = await getNotificationSettings(
    profile.id,
  );

  const message =
    params.message === "discord_linked"
      ? "Discord account linked successfully."
      : params.message === "password_updated"
        ? "Your password has been updated."
        : (params.message ?? null);

  const initialSection =
    params.section === "notifications" ? "notifications" : "profile";

  return (
    <SettingsView
      firstName={profile.firstName}
      lastName={profile.lastName}
      email={profile.email}
      linkedDiscordId={profile.discordId}
      teamName={team?.name ?? null}
      teamNumber={team?.number ?? null}
      message={message}
      error={params.error ?? null}
      initialNotificationSettings={initialNotificationSettings}
      initialSection={initialSection}
    />
  );
}
