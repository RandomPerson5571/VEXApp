export function getGitHubAppUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_GITHUB_APP_URL?.trim();
  return url || null;
}


export function getFusionAppUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_FUSION_APP_URL?.trim();
  return url || null;
}