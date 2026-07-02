import { EmbedBuilder } from "discord.js";

const GITHUB_COLOR = 0x24292f;
const MAX_EMBED_CHARS = 2000;

export const GITHUB_PREFERENCE_EVENT_IDS = [
  "push",
  "pull_request",
  "issues",
  "release",
  "deployment",
  "workflow_run",
] as const;

export type GitHubPreferenceEventId = (typeof GITHUB_PREFERENCE_EVENT_IDS)[number];

const GITHUB_EVENT_MAP: Record<string, GitHubPreferenceEventId> = {
  push: "push",
  pull_request: "pull_request",
  issues: "issues",
  release: "release",
  deployment: "deployment",
  deployment_status: "deployment",
  workflow_run: "workflow_run",
};

type JsonRecord = Record<string, unknown>;

export function mapGitHubEventToPreferenceId(
  event: string,
): GitHubPreferenceEventId | undefined {
  return GITHUB_EVENT_MAP[event];
}

export function extractRepositoryFullName(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const repository = (payload as JsonRecord).repository;
  if (!repository || typeof repository !== "object") {
    return undefined;
  }

  const fullName = (repository as JsonRecord).full_name;
  return typeof fullName === "string" ? fullName : undefined;
}

export function formatGitHubNotificationEmbed(
  githubEvent: string,
  eventType: GitHubPreferenceEventId,
  payload: unknown,
  repositoryFullName: string,
): EmbedBuilder | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as JsonRecord;

  switch (eventType) {
    case "push":
      return formatPushEmbed(data, repositoryFullName);
    case "pull_request":
      return formatPullRequestEmbed(data, repositoryFullName);
    case "issues":
      return formatIssuesEmbed(data, repositoryFullName);
    case "release":
      return formatReleaseEmbed(data, repositoryFullName);
    case "deployment":
      return formatDeploymentEmbed(data, repositoryFullName, githubEvent);
    case "workflow_run":
      return formatWorkflowRunEmbed(data, repositoryFullName);
    default:
      return null;
  }
}

function formatPushEmbed(data: JsonRecord, repositoryFullName: string): EmbedBuilder {
  const ref = readString(data, "ref");
  const branch = ref?.replace(/^refs\/heads\//, "") ?? "unknown";
  const pusher = readNestedString(data, "pusher", "name") ?? "unknown";
  const commits = Array.isArray(data.commits) ? data.commits.length : 0;
  const compare = readString(data, "compare");
  const repoUrl =
    readNestedString(data, "repository", "html_url") ??
    `https://github.com/${repositoryFullName}`;

  const embed = new EmbedBuilder()
    .setColor(GITHUB_COLOR)
    .setTitle(`Push to ${branch}`)
    .setDescription(
      [
        `**Repository:** ${repositoryFullName}`,
        `**Branch:** ${branch}`,
        `**Pusher:** ${pusher}`,
        `**Commits:** ${commits}`,
        `**Link:** ${compare ?? repoUrl}`,
      ].join("\n"),
    )
    .setTimestamp();

  return clampEmbedSize(embed);
}

function formatPullRequestEmbed(
  data: JsonRecord,
  repositoryFullName: string,
): EmbedBuilder {
  const action = readString(data, "action") ?? "updated";
  const title = readNestedString(data, "pull_request", "title") ?? "Untitled";
  const author =
    readNestedString(data, "pull_request", "user", "login") ?? "unknown";
  const link =
    readNestedString(data, "pull_request", "html_url") ??
    `https://github.com/${repositoryFullName}/pulls`;

  const embed = new EmbedBuilder()
    .setColor(GITHUB_COLOR)
    .setTitle(`Pull Request ${action}`)
    .setDescription(
      [
        `**Repository:** ${repositoryFullName}`,
        `**Title:** ${title}`,
        `**Author:** ${author}`,
        `**Link:** ${link}`,
      ].join("\n"),
    )
    .setTimestamp();

  return clampEmbedSize(embed);
}

function formatIssuesEmbed(data: JsonRecord, repositoryFullName: string): EmbedBuilder {
  const action = readString(data, "action") ?? "updated";
  const title = readNestedString(data, "issue", "title") ?? "Untitled";
  const author = readNestedString(data, "issue", "user", "login") ?? "unknown";
  const link =
    readNestedString(data, "issue", "html_url") ??
    `https://github.com/${repositoryFullName}/issues`;

  const embed = new EmbedBuilder()
    .setColor(GITHUB_COLOR)
    .setTitle(`Issue ${action}`)
    .setDescription(
      [
        `**Repository:** ${repositoryFullName}`,
        `**Title:** ${title}`,
        `**Author:** ${author}`,
        `**Link:** ${link}`,
      ].join("\n"),
    )
    .setTimestamp();

  return clampEmbedSize(embed);
}

function formatReleaseEmbed(data: JsonRecord, repositoryFullName: string): EmbedBuilder {
  const action = readString(data, "action") ?? "updated";
  const tag = readNestedString(data, "release", "tag_name") ?? "unknown";
  const link =
    readNestedString(data, "release", "html_url") ??
    `https://github.com/${repositoryFullName}/releases`;

  const embed = new EmbedBuilder()
    .setColor(GITHUB_COLOR)
    .setTitle(`Release ${action}`)
    .setDescription(
      [
        `**Repository:** ${repositoryFullName}`,
        `**Tag:** ${tag}`,
        `**Link:** ${link}`,
      ].join("\n"),
    )
    .setTimestamp();

  return clampEmbedSize(embed);
}

function formatDeploymentEmbed(
  data: JsonRecord,
  repositoryFullName: string,
  githubEvent: string,
): EmbedBuilder {
  const deployment = readRecord(data, "deployment");
  const deploymentStatus = readRecord(data, "deployment_status");
  const environment =
    readString(deployment, "environment") ??
    readString(deploymentStatus, "environment") ??
    "unknown";
  const status =
    readString(deploymentStatus, "state") ??
    readString(deployment, "status") ??
    "unknown";
  const link =
    readString(deploymentStatus, "log_url") ??
    readString(deployment, "url") ??
    `https://github.com/${repositoryFullName}/deployments`;

  const embed = new EmbedBuilder()
    .setColor(GITHUB_COLOR)
    .setTitle(githubEvent === "deployment_status" ? "Deployment Status" : "Deployment")
    .setDescription(
      [
        `**Repository:** ${repositoryFullName}`,
        `**Environment:** ${environment}`,
        `**Status:** ${status}`,
        `**Link:** ${link}`,
      ].join("\n"),
    )
    .setTimestamp();

  return clampEmbedSize(embed);
}

function formatWorkflowRunEmbed(
  data: JsonRecord,
  repositoryFullName: string,
): EmbedBuilder {
  const name = readNestedString(data, "workflow_run", "name") ?? "Workflow";
  const conclusion =
    readNestedString(data, "workflow_run", "conclusion") ??
    readNestedString(data, "workflow_run", "status") ??
    "unknown";
  const link =
    readNestedString(data, "workflow_run", "html_url") ??
    `https://github.com/${repositoryFullName}/actions`;

  const embed = new EmbedBuilder()
    .setColor(GITHUB_COLOR)
    .setTitle("Workflow Run")
    .setDescription(
      [
        `**Repository:** ${repositoryFullName}`,
        `**Workflow:** ${name}`,
        `**Conclusion:** ${conclusion}`,
        `**Link:** ${link}`,
      ].join("\n"),
    )
    .setTimestamp();

  return clampEmbedSize(embed);
}

function readRecord(value: unknown, key: string): JsonRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as JsonRecord;
  const nested = record[key];
  return nested && typeof nested === "object" ? (nested as JsonRecord) : undefined;
}

function readString(record: JsonRecord | undefined, key: string): string | undefined {
  if (!record) {
    return undefined;
  }

  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNestedString(
  record: JsonRecord | undefined,
  ...path: string[]
): string | undefined {
  let current: unknown = record;

  for (const key of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as JsonRecord)[key];
  }

  return typeof current === "string" ? current : undefined;
}

function embedCharacterCount(embed: EmbedBuilder): number {
  const json = embed.toJSON();
  let total = 0;

  if (json.title) total += json.title.length;
  if (json.description) total += json.description.length;
  if (json.footer?.text) total += json.footer.text.length;
  if (json.author?.name) total += json.author.name.length;

  for (const field of json.fields ?? []) {
    total += field.name.length + field.value.length;
  }

  return total;
}

function clampEmbedSize(embed: EmbedBuilder, maxChars = MAX_EMBED_CHARS): EmbedBuilder {
  if (embedCharacterCount(embed) <= maxChars) {
    return embed;
  }

  const json = embed.toJSON();
  if (!json.description) {
    return embed;
  }

  const overhead = embedCharacterCount(embed) - json.description.length;
  const maxDescriptionLength = Math.max(0, maxChars - overhead - 3);
  const truncated = `${json.description.slice(0, maxDescriptionLength)}...`;

  return EmbedBuilder.from({ ...json, description: truncated });
}
