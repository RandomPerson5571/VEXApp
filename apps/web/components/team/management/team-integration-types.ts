/** Mirrors TeamGitHubIntegration from schema — UI/mock layer only. */
export type TeamGitHubIntegration = {
  id: string;
  repositoryId: number | null;
  repositoryFullName: string;
  repositoryUrl: string | null;
  webhookId: string | null;
  installationId: number | null;
  isActive: boolean;
};

/** Mirrors TeamFusionIntegration from schema — UI/mock layer only. */
export type TeamFusionIntegration = {
  id: string;
  projectUrn: string;
  projectName: string | null;
  hookId: string | null;
  isActive: boolean;
};

export const MOCK_GITHUB_REPOS = [
  { fullName: "stlvex-robotics/competition-bot", url: "https://github.com/stlvex-robotics/competition-bot" },
  { fullName: "stlvex-robotics/autonomous", url: "https://github.com/stlvex-robotics/autonomous" },
] as const;

export const MOCK_FUSION_PROJECTS = [
  { urn: "urn:adsk.wipprod:fs.folder:co.abc123", name: "2025 Competition Robot" },
  { urn: "urn:adsk.wipprod:fs.folder:co.def456", name: "Drivetrain Subassembly" },
] as const;
