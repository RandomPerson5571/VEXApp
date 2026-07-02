import { IntegrationsSettingsView } from "@/components/settings/IntegrationsSettingsView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGitHubAppUrl } from "@/lib/integrations/env";

type SettingsIntegrationsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function SettingsIntegrationsPage({
  searchParams,
}: SettingsIntegrationsPageProps) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const message =
    params.message === "discord_linked"
      ? "Discord account linked successfully."
      : (params.message ?? null);

  return (
    <IntegrationsSettingsView
      linkedDiscordId={user.profile.discordId}
      githubAppUrl={getGitHubAppUrl()}
      message={message}
      error={params.error ?? null}
    />
  );
}
