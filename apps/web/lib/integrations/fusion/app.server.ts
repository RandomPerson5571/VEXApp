import "server-only";

import { getFusionOAuthRedirectUri } from "./auth-url.server";

const APS_BASE_URL = "https://developer.api.autodesk.com";
const FUSION_WEBHOOK_EVENT = "dm.version.added";

export type FusionProject = {
  id: string;
  name: string;
  folderUrn: string;
  hubId: string;
};

export type FusionProjectDetails = {
  folderUrn: string;
  projectName: string;
};

export class FusionAppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FusionAppConfigError";
  }
}

export class FusionApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FusionApiError";
    this.status = status;
  }
}

type JsonRecord = Record<string, unknown>;

function getFusionClientCredentials() {
  const clientId = process.env.FUSION_CLIENT_ID?.trim();
  const clientSecret = process.env.FUSION_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new FusionAppConfigError("Fusion OAuth credentials are not configured.");
  }

  return { clientId, clientSecret };
}

function getBotPublicUrl(): string {
  const url = process.env.BOT_PUBLIC_URL?.trim();

  if (!url) {
    throw new FusionAppConfigError("BOT_PUBLIC_URL is not configured.");
  }

  return url.replace(/\/$/, "");
}

async function parseApsJsonResponse(response: Response): Promise<JsonRecord> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new FusionApiError(
      "Fusion API returned an invalid JSON response.",
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "developerMessage" in body &&
      typeof (body as JsonRecord).developerMessage === "string"
        ? ((body as JsonRecord).developerMessage as string)
        : body &&
            typeof body === "object" &&
            "error" in body &&
            typeof (body as JsonRecord).error === "string"
          ? ((body as JsonRecord).error as string)
          : `Fusion API request failed (${response.status}).`;

    throw new FusionApiError(message, response.status);
  }

  if (!body || typeof body !== "object") {
    throw new FusionApiError("Fusion API returned an empty response.");
  }

  return body as JsonRecord;
}

async function requestApsToken(body: URLSearchParams): Promise<string> {
  const { clientId, clientSecret } = getFusionClientCredentials();

  const response = await fetch(`${APS_BASE_URL}/authentication/v2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
  });

  const payload = await parseApsJsonResponse(response);
  const accessToken = payload.access_token;

  if (typeof accessToken !== "string" || !accessToken) {
    throw new FusionApiError("Fusion token response is missing access_token.");
  }

  return accessToken;
}

export async function exchangeAuthorizationCode(
  code: string,
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getFusionOAuthRedirectUri(),
  });

  return requestApsToken(params);
}

export async function getClientCredentialsToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "data:read data:create data:write",
  });

  return requestApsToken(params);
}

async function apsGet(
  accessToken: string,
  path: string,
): Promise<JsonRecord> {
  const response = await fetch(`${APS_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseApsJsonResponse(response);
}

function readRelationshipId(
  relationships: unknown,
  key: string,
): string | null {
  if (!relationships || typeof relationships !== "object") {
    return null;
  }

  const relationship = (relationships as JsonRecord)[key];

  if (!relationship || typeof relationship !== "object") {
    return null;
  }

  const data = (relationship as JsonRecord).data;

  if (!data || typeof data !== "object") {
    return null;
  }

  const id = (data as JsonRecord).id;

  return typeof id === "string" && id ? id : null;
}

function readProjectName(attributes: unknown): string {
  if (!attributes || typeof attributes !== "object") {
    return "Unnamed project";
  }

  const name = (attributes as JsonRecord).name;

  return typeof name === "string" && name.trim() ? name.trim() : "Unnamed project";
}

export async function listFusionProjects(
  accessToken: string,
): Promise<FusionProject[]> {
  const hubsResponse = await apsGet(accessToken, "/project/v1/hubs");
  const hubs = Array.isArray(hubsResponse.data) ? hubsResponse.data : [];
  const projects: FusionProject[] = [];

  for (const hub of hubs) {
    if (!hub || typeof hub !== "object") {
      continue;
    }

    const hubId = (hub as JsonRecord).id;

    if (typeof hubId !== "string" || !hubId) {
      continue;
    }

    const projectsResponse = await apsGet(
      accessToken,
      `/project/v1/hubs/${encodeURIComponent(hubId)}/projects`,
    );
    const hubProjects = Array.isArray(projectsResponse.data)
      ? projectsResponse.data
      : [];

    for (const project of hubProjects) {
      if (!project || typeof project !== "object") {
        continue;
      }

      const projectId = (project as JsonRecord).id;

      if (typeof projectId !== "string" || !projectId) {
        continue;
      }

      let folderUrn = readRelationshipId(
        (project as JsonRecord).relationships,
        "rootFolder",
      );

      if (!folderUrn) {
        const topFoldersResponse = await apsGet(
          accessToken,
          `/project/v1/hubs/${encodeURIComponent(hubId)}/projects/${encodeURIComponent(projectId)}/topFolders`,
        );
        const topFolders = Array.isArray(topFoldersResponse.data)
          ? topFoldersResponse.data
          : [];
        const firstFolder = topFolders[0];

        if (firstFolder && typeof firstFolder === "object") {
          const folderId = (firstFolder as JsonRecord).id;
          folderUrn = typeof folderId === "string" ? folderId : null;
        }
      }

      if (!folderUrn) {
        continue;
      }

      projects.push({
        id: projectId,
        name: readProjectName((project as JsonRecord).attributes),
        folderUrn,
        hubId,
      });
    }
  }

  return projects;
}

export async function getFusionProjectDetails(
  accessToken: string,
  folderUrn: string,
  projectName: string | null,
): Promise<FusionProjectDetails> {
  const projects = await listFusionProjects(accessToken);
  const match = projects.find((project) => project.folderUrn === folderUrn);

  if (!match) {
    throw new FusionApiError(
      "Selected Fusion project is not accessible with the current authorization.",
      404,
    );
  }

  return {
    folderUrn: match.folderUrn,
    projectName: projectName?.trim() || match.name,
  };
}

export async function createProjectWebhook(
  accessToken: string,
  folderUrn: string,
): Promise<string> {
  const callbackUrl = `${getBotPublicUrl()}/api/fusion`;
  const response = await fetch(
    `${APS_BASE_URL}/webhooks/v1/systems/data/events/${FUSION_WEBHOOK_EVENT}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callbackUrl,
        scope: {
          folder: folderUrn,
        },
      }),
    },
  );

  const payload = await parseApsJsonResponse(response);
  const hook = payload.hook;

  if (!hook || typeof hook !== "object") {
    throw new FusionApiError("Fusion webhook response is missing hook metadata.");
  }

  const hookId = (hook as JsonRecord).hookId;

  if (typeof hookId !== "string" || !hookId) {
    throw new FusionApiError("Fusion webhook response is missing hookId.");
  }

  return hookId;
}

export async function deleteProjectWebhook(hookId: string): Promise<void> {
  const accessToken = await getClientCredentialsToken();
  const response = await fetch(
    `${APS_BASE_URL}/webhooks/v1/systems/data/events/${FUSION_WEBHOOK_EVENT}/hooks/${encodeURIComponent(hookId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    await parseApsJsonResponse(response);
  }
}

export function isValidFusionFolderUrn(value: string): boolean {
  return /^urn:adsk\./.test(value.trim());
}
