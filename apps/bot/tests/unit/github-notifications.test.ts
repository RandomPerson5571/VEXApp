import { describe, expect, it } from "vitest";

import {
  extractRepositoryFullName,
  formatGitHubNotificationEmbed,
  mapGitHubEventToPreferenceId,
} from "../../src/services/github-notifications.js";

describe("mapGitHubEventToPreferenceId", () => {
  it("maps supported GitHub events to preference ids", () => {
    expect(mapGitHubEventToPreferenceId("push")).toBe("push");
    expect(mapGitHubEventToPreferenceId("pull_request")).toBe("pull_request");
    expect(mapGitHubEventToPreferenceId("issues")).toBe("issues");
    expect(mapGitHubEventToPreferenceId("release")).toBe("release");
    expect(mapGitHubEventToPreferenceId("deployment")).toBe("deployment");
    expect(mapGitHubEventToPreferenceId("deployment_status")).toBe(
      "deployment",
    );
    expect(mapGitHubEventToPreferenceId("workflow_run")).toBe("workflow_run");
  });

  it("returns undefined for unsupported events", () => {
    expect(mapGitHubEventToPreferenceId("ping")).toBeUndefined();
    expect(mapGitHubEventToPreferenceId("star")).toBeUndefined();
  });
});

describe("extractRepositoryFullName", () => {
  it("reads repository.full_name from webhook payloads", () => {
    expect(
      extractRepositoryFullName({
        repository: { full_name: "vex-team/robot-code" },
      }),
    ).toBe("vex-team/robot-code");
  });

  it("returns undefined for malformed payloads", () => {
    expect(extractRepositoryFullName(null)).toBeUndefined();
    expect(extractRepositoryFullName({})).toBeUndefined();
    expect(
      extractRepositoryFullName({ repository: { full_name: 42 } }),
    ).toBeUndefined();
  });
});

describe("formatGitHubNotificationEmbed", () => {
  it("formats push notifications", () => {
    const embed = formatGitHubNotificationEmbed(
      "push",
      "push",
      {
        ref: "refs/heads/main",
        pusher: { name: "alice" },
        commits: [{}, {}],
        compare: "https://github.com/vex-team/robot-code/compare/abc",
        repository: {
          full_name: "vex-team/robot-code",
          html_url: "https://github.com/vex-team/robot-code",
        },
      },
      "vex-team/robot-code",
    );

    expect(embed).not.toBeNull();
    const json = embed!.toJSON();
    expect(json.title).toBe("Push to main");
    expect(json.description).toContain("**Repository:** vex-team/robot-code");
    expect(json.description).toContain("**Pusher:** alice");
    expect(json.description).toContain("**Commits:** 2");
  });

  it("formats pull request notifications", () => {
    const embed = formatGitHubNotificationEmbed(
      "pull_request",
      "pull_request",
      {
        action: "opened",
        pull_request: {
          title: "Add intake",
          user: { login: "bob" },
          html_url: "https://github.com/vex-team/robot-code/pull/7",
        },
      },
      "vex-team/robot-code",
    );

    expect(embed).not.toBeNull();
    const json = embed!.toJSON();
    expect(json.title).toBe("Pull Request opened");
    expect(json.description).toContain("**Title:** Add intake");
    expect(json.description).toContain("**Author:** bob");
  });

  it("formats deployment status notifications", () => {
    const embed = formatGitHubNotificationEmbed(
      "deployment_status",
      "deployment",
      {
        deployment_status: {
          environment: "production",
          state: "success",
          log_url: "https://github.com/vex-team/robot-code/deployments",
        },
      },
      "vex-team/robot-code",
    );

    expect(embed).not.toBeNull();
    const json = embed!.toJSON();
    expect(json.title).toBe("Deployment Status");
    expect(json.description).toContain("**Environment:** production");
    expect(json.description).toContain("**Status:** success");
  });

  it("returns null when the payload cannot be formatted", () => {
    expect(
      formatGitHubNotificationEmbed(
        "push",
        "push",
        null,
        "vex-team/robot-code",
      ),
    ).toBeNull();
  });
});
