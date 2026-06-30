import { ProfileSettingsView } from "@/components/settings/ProfileSettingsView";
import { getCurrentUser } from "@/lib/auth/current-user";

type SettingsProfilePageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function SettingsProfilePage({
  searchParams,
}: SettingsProfilePageProps) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const { profile, team } = user;
  const message =
    params.message === "discord_linked"
      ? "Discord account linked successfully."
      : params.message === "password_updated"
        ? "Your password has been updated."
        : (params.message ?? null);

  return (
    <ProfileSettingsView
      firstName={profile.firstName}
      lastName={profile.lastName}
      email={profile.email}
      linkedDiscordId={profile.discordId}
      teamName={team?.name ?? null}
      teamNumber={team?.number ?? null}
      message={message}
      error={params.error ?? null}
    />
  );
}
