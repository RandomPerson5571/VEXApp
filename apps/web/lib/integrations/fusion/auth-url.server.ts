import "server-only";

import { createFusionOAuthState } from "./state.server";

const APS_AUTHORIZE_URL =
  "https://developer.api.autodesk.com/authentication/v2/authorize";
const FUSION_OAUTH_SCOPES = "data:read data:create";

function getFusionClientId(): string {
  const clientId = process.env.FUSION_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("FUSION_CLIENT_ID is not configured.");
  }

  return clientId;
}

export function getFusionOAuthRedirectUri(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  return `${siteUrl.replace(/\/$/, "")}/api/integrations/fusion/callback`;
}

export function buildFusionAuthorizeUrl(teamId: string, userId: string): string {
  const url = new URL(APS_AUTHORIZE_URL);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getFusionClientId());
  url.searchParams.set("redirect_uri", getFusionOAuthRedirectUri());
  url.searchParams.set("scope", FUSION_OAUTH_SCOPES);
  url.searchParams.set("state", createFusionOAuthState(teamId, userId));

  return url.toString();
}
