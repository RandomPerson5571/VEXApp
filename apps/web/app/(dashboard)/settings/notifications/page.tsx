import { redirect } from "next/navigation";

export default function SettingsNotificationsRedirect() {
  redirect("/settings?section=notifications");
}
