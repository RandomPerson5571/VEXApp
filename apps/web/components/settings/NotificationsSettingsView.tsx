"use client";

import { Bell, Check } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Switch } from "@stlvex/ui/components/switch";

import Github from "@/public/logos/github-icon.svg";
import Fusion360 from "@/public/logos/fusion360-icon.svg";

import { SettingsSection } from "./SettingsSection";

type GitHubEventId =
  | "push"
  | "pull_request"
  | "issues"
  | "release"
  | "deployment"
  | "workflow_run";

type GitHubEventOption = {
  id: GitHubEventId;
  label: string;
  description: string;
};

type NotificationPreferences = {
  enableDiscordPushNotifs: boolean;
  githubNotifsEnabled: boolean;
  githubEvents: GitHubEventId[];
  fusionNotifsEnabled: boolean;
};

const GITHUB_EVENTS: GitHubEventOption[] = [
  {
    id: "push",
    label: "Pushes",
    description: "Commits pushed to connected repositories.",
  },
  {
    id: "pull_request",
    label: "Pull requests",
    description: "Opened, updated, merged, or closed pull requests.",
  },
  {
    id: "issues",
    label: "Issues",
    description: "New issues, comments, and status changes.",
  },
  {
    id: "release",
    label: "Releases",
    description: "Published or edited release tags.",
  },
  {
    id: "deployment",
    label: "Deployments",
    description: "Deployment status updates from CI/CD pipelines.",
  },
  {
    id: "workflow_run",
    label: "Workflow runs",
    description: "GitHub Actions workflow completions and failures.",
  },
];

const DEFAULT_SETTINGS: NotificationPreferences = {
  enableDiscordPushNotifs: true,
  githubNotifsEnabled: false,
  githubEvents: ["push", "pull_request"],
  fusionNotifsEnabled: false,
};

function sortEvents(events: GitHubEventId[]) {
  return [...events].sort().join(",");
}

function preferencesEqual(a: NotificationPreferences, b: NotificationPreferences) {
  return (
    a.enableDiscordPushNotifs === b.enableDiscordPushNotifs &&
    a.githubNotifsEnabled === b.githubNotifsEnabled &&
    a.fusionNotifsEnabled === b.fusionNotifsEnabled &&
    sortEvents(a.githubEvents) === sortEvents(b.githubEvents)
  );
}

type NotificationSettingRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

function NotificationSettingRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: NotificationSettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1 space-y-1">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          {label}
        </label>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 data-[state=checked]:bg-[#1f883d] data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
        aria-label={label}
      />
    </div>
  );
}

type NotificationEventCheckboxProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

function NotificationEventCheckbox({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: NotificationEventCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition duration-200 motion-reduce:transition-none ${
        checked
          ? "border-[#1f883d]/30 bg-[#1f883d]/5 dark:border-[#3fb950]/25 dark:bg-[#3fb950]/5"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition duration-200 motion-reduce:transition-none ${
          checked
            ? "border-[#1f883d] bg-[#1f883d] text-white dark:border-[#3fb950] dark:bg-[#3fb950]"
            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
        }`}
        aria-hidden
      >
        {checked ? <Check className="h-3 w-3 stroke-[3]" /> : null}
      </span>
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function IntegrationHeader({
  icon,
  name,
  description,
  accentClassName,
}: {
  icon: string;
  name: string;
  description: string;
  accentClassName: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 border-b border-slate-200 pb-4 dark:border-slate-900/80">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentClassName}`}
      >
        <Image src={icon} alt="" width={20} height={20} aria-hidden />
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
          {name}
        </h3>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export function NotificationsSettingsView() {
  const [saved, setSaved] = useState<NotificationPreferences>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<NotificationPreferences>(DEFAULT_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => !preferencesEqual(draft, saved),
    [draft, saved],
  );

  const updateDraft = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => {
    setSaveMessage(null);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleGithubEvent = (eventId: GitHubEventId, checked: boolean) => {
    setSaveMessage(null);
    setDraft((current) => {
      if (checked) {
        return current.githubEvents.includes(eventId)
          ? current
          : { ...current, githubEvents: [...current.githubEvents, eventId] };
      }

      return {
        ...current,
        githubEvents: current.githubEvents.filter((event) => event !== eventId),
      };
    });
  };

  const handleSave = () => {
    if (!isDirty) {
      return;
    }

    setSaved({ ...draft, githubEvents: [...draft.githubEvents] });
    setSaveMessage("Notification preferences updated.");
  };

  const handleReset = () => {
    setDraft({ ...saved, githubEvents: [...saved.githubEvents] });
    setSaveMessage(null);
  };

  const {
    enableDiscordPushNotifs,
    githubNotifsEnabled,
    githubEvents,
    fusionNotifsEnabled,
  } = draft;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100">
          Notifications
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          Choose how and when you receive updates from connected integrations.
        </p>
      </div>

      <SettingsSection
        title="Delivery"
        description="Control where notifications are sent when activity occurs in your team hub."
      >
        <div className="divide-y divide-slate-200 dark:divide-slate-900/80">
          <NotificationSettingRow
            id="discord-push-notifs"
            label="Discord push notifications"
            description="Send alerts to your linked Discord account when enabled integrations produce activity."
            checked={enableDiscordPushNotifs}
            onCheckedChange={(checked) =>
              updateDraft("enableDiscordPushNotifs", checked)
            }
          />
        </div>

        {!enableDiscordPushNotifs ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
              Integration alerts will still be recorded in the team hub, but
              Discord delivery is paused until you re-enable push notifications.
            </p>
          </div>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title="Integrations"
        description="Fine-tune which repository and design events trigger notifications."
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition duration-200 dark:border-slate-900 dark:bg-slate-950/40">
            <IntegrationHeader
              icon={Github.src}
              name="GitHub"
              description="Repository activity from your team's connected GitHub integration."
              accentClassName="bg-slate-500/10 border-slate-500/20"
            />

            <div className="divide-y divide-slate-200 dark:divide-slate-900/80">
              <NotificationSettingRow
                id="github-notifs-enabled"
                label="Enable GitHub notifications"
                description="Receive alerts when selected events occur in linked repositories."
                checked={githubNotifsEnabled}
                onCheckedChange={(checked) =>
                  updateDraft("githubNotifsEnabled", checked)
                }
                disabled={!enableDiscordPushNotifs}
              />
            </div>

            {githubNotifsEnabled && enableDiscordPushNotifs ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/50">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Events
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {GITHUB_EVENTS.map((event) => (
                    <NotificationEventCheckbox
                      key={event.id}
                      id={`github-event-${event.id}`}
                      label={event.label}
                      description={event.description}
                      checked={githubEvents.includes(event.id)}
                      onCheckedChange={(checked) =>
                        toggleGithubEvent(event.id, checked)
                      }
                    />
                  ))}
                </div>
                {githubEvents.length === 0 ? (
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                    Select at least one event to receive GitHub notifications.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition duration-200 dark:border-slate-900 dark:bg-slate-950/40">
            <IntegrationHeader
              icon={Fusion360.src}
              name="Fusion 360"
              description="Design and version updates from your team's Fusion 360 project."
              accentClassName="bg-blue-500/10 border-blue-500/20"
            />

            <div className="divide-y divide-slate-200 dark:divide-slate-900/80">
              <NotificationSettingRow
                id="fusion-notifs-enabled"
                label="Enable Fusion 360 notifications"
                description="Receive alerts when design files are updated, versioned, or published."
                checked={fusionNotifsEnabled}
                onCheckedChange={(checked) =>
                  updateDraft("fusionNotifsEnabled", checked)
                }
                disabled={!enableDiscordPushNotifs}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-900 dark:bg-[#090e18]/80">
        {saveMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-sm text-emerald-600 dark:text-emerald-300">
            {saveMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-500">
            {isDirty
              ? "You have unsaved notification preferences."
              : "Notification preferences are up to date."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty}
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-900 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:text-slate-200"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || (githubNotifsEnabled && githubEvents.length === 0)}
              className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold tracking-wide text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:text-blue-200/70"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
