import "server-only";

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

export type GitHubInstallationRepository = {
  id: number;
  fullName: string;
  htmlUrl: string;
  private: boolean;
};

export type GitHubRepositoryDetails = {
  repositoryId: number;
  htmlUrl: string;
  fullName: string;
};

export class GitHubAppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubAppConfigError";
  }
}

export class GitHubApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

function getGitHubAppConfig() {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.trim();

  if (!appId || !privateKey) {
    throw new GitHubAppConfigError("GitHub App credentials are not configured.");
  }

  return {
    appId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function createGitHubAppAuth() {
  const { appId, privateKey } = getGitHubAppConfig();

  return createAppAuth({
    appId,
    privateKey,
  });
}

async function createInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const auth = createGitHubAppAuth();

  try {
    const { token } = await auth({
      type: "installation",
      installationId,
    });

    return new Octokit({ auth: token });
  } catch (error) {
    throw toGitHubApiError(error, "Failed to create installation access token.");
  }
}

function toGitHubApiError(
  error: unknown,
  fallbackMessage: string,
): GitHubApiError | GitHubAppConfigError {
  if (error instanceof GitHubAppConfigError || error instanceof GitHubApiError) {
    return error;
  }

  if (error instanceof Error) {
    const status =
      "status" in error && typeof error.status === "number"
        ? error.status
        : undefined;

    return new GitHubApiError(error.message, status);
  }

  return new GitHubApiError(fallbackMessage);
}

export async function listInstallationRepositories(
  installationId: number,
): Promise<GitHubInstallationRepository[]> {
  const octokit = await createInstallationOctokit(installationId);
  const repositories: GitHubInstallationRepository[] = [];

  try {
    for await (const response of octokit.paginate.iterator(
      octokit.rest.apps.listReposAccessibleToInstallation,
      { per_page: 100 },
    )) {
      for (const repo of response.data) {
        repositories.push({
          id: repo.id,
          fullName: repo.full_name,
          htmlUrl: repo.html_url,
          private: repo.private,
        });
      }
    }
  } catch (error) {
    throw toGitHubApiError(error, "Failed to list installation repositories.");
  }

  return repositories;
}

export async function getRepository(
  installationId: number,
  owner: string,
  repo: string,
): Promise<GitHubRepositoryDetails> {
  const octokit = await createInstallationOctokit(installationId);

  try {
    const { data } = await octokit.rest.repos.get({ owner, repo });

    return {
      repositoryId: data.id,
      htmlUrl: data.html_url,
      fullName: data.full_name,
    };
  } catch (error) {
    throw toGitHubApiError(error, "Failed to fetch repository details.");
  }
}

export function parseRepositoryFullName(
  repositoryFullName: string,
): { owner: string; repo: string } | null {
  const [owner, ...repoParts] = repositoryFullName.split("/");
  const repo = repoParts.join("/");

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}
