import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

import { DiscordLinkForm } from "./discord-link-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your Discord account so the bot can sync status updates.
          </p>
        </div>

        <DiscordLinkForm
          linkedDiscordId={user.profile.discordId}
          message={
            params.message === "discord_linked"
              ? "Discord account linked."
              : params.message
          }
          error={params.error}
        />
      </div>
    </div>
  );
}
