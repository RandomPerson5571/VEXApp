export const GITHUB_EVENT_IDS = [
  "push",
  "pull_request",
  "issues",
  "release",
  "deployment",
  "workflow_run",
] as const;

export type GitHubEventId = (typeof GITHUB_EVENT_IDS)[number];

export type GitHubEventOption = {
  id: GitHubEventId;
  label: string;
  description: string;
};

export type NotificationPreferences = {
  enableDiscordPushNotifs: boolean;
  githubNotifsEnabled: boolean;
  githubEvents: GitHubEventId[];
  fusionNotifsEnabled: boolean;
};

export const GITHUB_EVENTS: GitHubEventOption[] = [
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

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enableDiscordPushNotifs: true,
  githubNotifsEnabled: false,
  githubEvents: ["push", "pull_request"],
  fusionNotifsEnabled: false,
};

const GITHUB_EVENT_ID_SET = new Set<string>(GITHUB_EVENT_IDS);

export function isGitHubEventId(value: string): value is GitHubEventId {
  return GITHUB_EVENT_ID_SET.has(value);
}

export function normalizeGitHubEvents(events: string[]): GitHubEventId[] {
  return events.filter(isGitHubEventId);
}

export function sortEvents(events: GitHubEventId[]) {
  return [...events].sort().join(",");
}

export function preferencesEqual(
  a: NotificationPreferences,
  b: NotificationPreferences,
) {
  return (
    a.enableDiscordPushNotifs === b.enableDiscordPushNotifs &&
    a.githubNotifsEnabled === b.githubNotifsEnabled &&
    a.fusionNotifsEnabled === b.fusionNotifsEnabled &&
    sortEvents(a.githubEvents) === sortEvents(b.githubEvents)
  );
}

export function toNotificationPreferences(settings: {
  enableDiscordPushNotifs: boolean;
  githubNotifsEnabled: boolean;
  githubEvents: string[];
  fusionNotifsEnabled: boolean;
}): NotificationPreferences {
  const githubEvents = normalizeGitHubEvents(settings.githubEvents);

  return {
    enableDiscordPushNotifs: settings.enableDiscordPushNotifs,
    githubNotifsEnabled: settings.githubNotifsEnabled,
    githubEvents:
      githubEvents.length > 0
        ? githubEvents
        : [...DEFAULT_NOTIFICATION_PREFERENCES.githubEvents],
    fusionNotifsEnabled: settings.fusionNotifsEnabled,
  };
}
