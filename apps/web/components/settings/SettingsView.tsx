"use client";

import { useRouter } from "next/navigation";

import type { NotificationPreferences } from "@/lib/notifications/preferences";

import { NotificationsSettingsView } from "./NotificationsSettingsView";
import { ProfileSettingsView } from "./ProfileSettingsView";
import { SettingsSidebar, type SettingsSectionId } from "./SettingsSidebar";
import { InterfaceSettingsView } from "./InterfaceSettingsView";

type SettingsViewProps = {
  firstName: string;
  lastName: string;
  email: string;
  linkedDiscordId: string | null;
  message?: string | null;
  error?: string | null;
  initialNotificationSettings: NotificationPreferences;
  githubConnected?: boolean;
  initialSection?: SettingsSectionId;
};

export function SettingsView({
  firstName,
  lastName,
  email,
  linkedDiscordId,
  message,
  error,
  initialNotificationSettings,
  githubConnected = false,
  initialSection = "profile",
}: SettingsViewProps) {
  const router = useRouter();
  const section = initialSection;

  function handleSectionChange(next: SettingsSectionId) {
    // ponytail: drop message/error on tab switch; deep links land via server initialSection
    const href =
      next === "notifications"
        ? "/settings?section=notifications"
        : next === "interface"
          ? "/settings?section=interface"
          : "/settings";
    router.replace(href, { scroll: false });
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50 dark:bg-[#000000] font-sans dashboard-scroll">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SettingsSidebar section={section} onSectionChange={handleSectionChange} />
        <div className="lg:col-span-9">
          <div className={section === "profile" ? undefined : "hidden"}>
            <ProfileSettingsView
              firstName={firstName}
              lastName={lastName}
              email={email}
              linkedDiscordId={linkedDiscordId}
              message={message}
              error={error}
            />
          </div>
          <div className={section === "interface" ? undefined : "hidden"}>
            <InterfaceSettingsView />
          </div>
          <div className={section === "notifications" ? undefined : "hidden"}>
            <NotificationsSettingsView
              initialSettings={initialNotificationSettings}
              githubConnected={githubConnected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
