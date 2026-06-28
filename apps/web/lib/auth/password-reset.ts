import { getSiteUrl } from "@/app/(auth)/lib/site-url";

export const PASSWORD_UPDATE_PATH = "/update-password";

export async function getPasswordResetRedirectUrl(): Promise<string> {
  const siteUrl = await getSiteUrl();
  const next = encodeURIComponent(PASSWORD_UPDATE_PATH);

  return `${siteUrl}/auth/callback?next=${next}`;
}
