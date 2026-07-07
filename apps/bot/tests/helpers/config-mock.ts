import { vi } from "vitest";

const secrets = vi.hoisted(() => ({
  github: "vitest-github-webhook-secret",
  fusion: "vitest-fusion-webhook-secret",
  webhook: "vitest-webhook-secret",
}));

vi.mock("../../src/config.js", () => ({
  config: {
    token: "vitest-discord-token",
    clientId: "vitest-discord-client-id",
    guildId: "",
    generalMemberRoleId: "vitest-general-member-role",
    webhookPort: 3001,
    get webhookSecret() {
      return secrets.webhook;
    },
    get githubWebhookSecret() {
      return secrets.github;
    },
    get fusionWebhookSecret() {
      return secrets.fusion;
    },
  },
}));

export function setGithubWebhookSecret(value: string) {
  secrets.github = value;
}

export function setFusionWebhookSecret(value: string) {
  secrets.fusion = value;
}

export function resetRouteTestSecrets() {
  secrets.github = "vitest-github-webhook-secret";
  secrets.fusion = "vitest-fusion-webhook-secret";
  secrets.webhook = "vitest-webhook-secret";
}

export function getGithubWebhookSecret() {
  return secrets.github;
}

export function getFusionWebhookSecret() {
  return secrets.fusion;
}
