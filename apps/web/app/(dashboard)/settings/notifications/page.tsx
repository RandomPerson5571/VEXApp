import { NotificationsSettingsView } from "@/components/settings/NotificationsSettingsView";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getNotificationSettings } from "@/lib/notifications/settings.server";

export default async function SettingsNotificationsPage() {
  const user = (await getCurrentUser())!;
  const initialSettings = await getNotificationSettings(user.profile.id);

  return <NotificationsSettingsView initialSettings={initialSettings} />;
}
