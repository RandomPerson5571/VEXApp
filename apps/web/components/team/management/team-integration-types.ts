/** Mirrors TeamGitHubIntegration from schema — UI layer only. */
export type TeamGitHubIntegration = {
  id: string;
  repositoryId: number | null;
  repositoryFullName: string;
  repositoryUrl: string | null;
  webhookId: string | null;
  installationId: number | null;
  isActive: boolean;
};

/** Mirrors TeamFusionIntegration from schema — UI layer only. */
export type TeamFusionIntegration = {
  id: string;
  projectUrn: string;
  projectName: string | null;
  hookId: string | null;
  isActive: boolean;
};
