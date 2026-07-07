**IF YOU ARE AN AGENT, DO NOT MODIFY THIS FILE**

# GitHub Integration Flow

Team GitHub integration uses a **GitHub App installation** (not user OAuth). A team member installs the app on GitHub, picks a repository in the web app, and the link is stored in `TeamGitHubIntegration`. Webhook delivery and Discord notifications are handled by the bot service, not the web app.

## Overview

```
Team Management UI
  → GET /api/team/github/connect          (build signed install URL)
  → GitHub App install page               (user grants access)
  → GET /api/integrations/github/callback (verify state, redirect back)
  → GitHubRepoPickerModal                 (list repos for installation)
  → POST /api/team/github/connect         (persist integration)
```

After connect, the bot receives GitHub webhooks at `{BOT_PUBLIC_URL}/api/github` and routes events to Discord based on `repositoryFullName` and team notification preferences.

## Actors and permissions

| Actor | Role |
|-------|------|
| Team member with `canManageTeamIntegrations` | May connect, disconnect, and pause the integration |
| GitHub App | Installed on a GitHub org/user; grants repo access via installation tokens |
| Bot service | Receives webhooks and sends Discord DMs |

`canManageTeamIntegrations` returns true for any authorized same-team member (`scope === "TEAM"`) or global admin (`scope === "GLOBAL"`). This is broader than roster management (`TEAM_LEADER` only).

All team GitHub API routes call `requireTeamIntegrationAccess()` which checks:

1. Authenticated session (`getCurrentUser`)
2. User belongs to a team
3. `canManageTeamIntegrations(permissions)`

## Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_GITHUB_APP_URL` | Web | Base URL for the GitHub App install page |
| `GITHUB_INSTALL_STATE_SECRET` | Web | HMAC secret for signed install `state` tokens |
| `GITHUB_APP_ID` | Web | GitHub App ID for installation access tokens |
| `GITHUB_APP_PRIVATE_KEY` | Web | PEM private key for `@octokit/auth-app` |
| `NEXT_PUBLIC_SITE_URL` | Web | Origin for post-install redirects |
| `BOT_PUBLIC_URL` | Bot | Public webhook endpoint origin |
| `GITHUB_WEBHOOK_SECRET` | Bot | Verifies `x-hub-signature-256` on incoming webhooks |

Configure the GitHub App **Setup URL / Callback URL** to:

```
{NEXT_PUBLIC_SITE_URL}/api/integrations/github/callback
```

## Phase 1 — Start install

**Trigger:** User clicks **Connect Repository** in `GitHubIntegrationPanel`.

**Request:** `GET /api/team/github/connect`

**Guards:**

- Returns `409` if the team already has a `TeamGitHubIntegration` row (one repo per team).
- Returns `503` if `NEXT_PUBLIC_GITHUB_APP_URL` is not configured.

**Response:** `{ installUrl }` where `installUrl` is built by `buildGitHubInstallUrl(teamId, userId)`:

1. Read `NEXT_PUBLIC_GITHUB_APP_URL`.
2. Append a signed `state` query param via `createGitHubInstallState`.

The client redirects with `window.location.href = installUrl`.

## Phase 2 — Signed install state

Install state prevents CSRF and binds the GitHub install to a specific user and team.

**Implementation:** `lib/integrations/github/state.server.ts`

**Payload shape:**

```ts
{
  teamId: string;
  userId: string;
  nonce: string;      // 16 random bytes, hex-encoded
  issuedAt: number;   // Date.now()
}
```

**Token format:** `{base64url(JSON)}.{base64url(HMAC-SHA256)}`

**TTL:** 15 minutes

**Verification on callback:**

- Valid format and signature (`timingSafeEqual`)
- Required fields present
- Not expired
- `payload.userId` matches authenticated user
- `payload.teamId` matches user's current team

Unit tests: `tests/unit/integrations/github-state.test.ts`

## Phase 3 — GitHub App installation

The user completes installation on GitHub (select org/account, grant repo access).

GitHub redirects to the configured callback with:

```
?state={signedState}&installation_id={number}
```

## Phase 4 — OAuth callback

**Route:** `GET /api/integrations/github/callback`

**Success path:**

1. Verify authenticated user.
2. Verify and decode `state`.
3. Match `userId` and `teamId` against the session profile.
4. Parse positive integer `installation_id`.
5. Redirect to `/team-management?githubInstall={installationId}`.

**Error path:** Redirect to `/team-management?githubError={message}` for:

- Missing or invalid state
- State/user/team mismatch
- Missing installation ID
- User not on a team

Unauthenticated users receive `401` JSON (no redirect).

`TeamManagementView` reads these query params on mount, strips them from the URL via `router.replace`, and either shows a banner error or opens the repo picker modal.

## Phase 5 — Repository selection

**Trigger:** `githubInstall` query param sets `repoPickerInstallationId` in `TeamManagementView`.

**Modal:** `GitHubRepoPickerModal`

**Request:** `GET /api/team/github/repos?installationId={id}`

Uses `listInstallationRepositories(installationId)` which paginates `apps.listReposAccessibleToInstallation` via an installation-scoped Octokit token from `@octokit/auth-app`.

The user selects a repo and submits.

## Phase 6 — Persist integration

**Request:** `POST /api/team/github/connect`

```json
{
  "installationId": 12345,
  "repositoryFullName": "org/repo"
}
```

**Server logic:** `connectTeamRepository()` in `lib/integrations/github/team.server.ts`

1. Confirm caller is a member of the team.
2. Parse `owner/repo` from `repositoryFullName`.
3. Reject if team already has an integration (`409 ALREADY_CONNECTED`).
4. Reject if `installationId` is linked to a different team (`409 INSTALLATION_IN_USE`).
5. Fetch repo metadata from GitHub via `getRepository(installationId, owner, repo)`.
6. Confirm returned `fullName` matches the request.
7. Create `TeamGitHubIntegration` with `isActive: true`.

**Stored fields:**

| Field | Source |
|-------|--------|
| `teamId` | Authenticated user's team |
| `installationId` | GitHub App installation |
| `repositoryId` | GitHub API |
| `repositoryFullName` | User selection |
| `repositoryUrl` | GitHub API `html_url` |
| `webhookId` | Reserved; not set during connect today |
| `isActive` | `true` |

## Ongoing management

| Action | Route | Notes |
|--------|-------|-------|
| Read integration | `GET /api/team/github` | Returns `{ integration }` or `null` |
| Pause / resume | `PATCH /api/team/github` | Body: `{ isActive: boolean }` |
| Disconnect | `DELETE /api/team/github` | Deletes the row; returns `404` if none |

The UI reflects state in `GitHubIntegrationPanel` (connected badge, repo link, active toggle, disconnect button).

## Webhook delivery (bot)

The web app does **not** receive GitHub webhooks. After connect, events flow separately:

```
GitHub → POST {BOT_PUBLIC_URL}/api/github
       → findTeamGitHubIntegrationByRepo(repositoryFullName)
       → skip if missing or !isActive
       → findGitHubNotificationRecipients(teamId, eventType)
       → sendDiscordDmBatch
```

See `apps/bot/README.md` for webhook URL and TLS requirements.

## Key files

| Path | Responsibility |
|------|----------------|
| `components/team/management/GitHubIntegrationPanel.tsx` | Connect button, status display |
| `components/team/TeamManagementView.tsx` | Callback query-param handling, connect/disconnect/toggle |
| `components/team/management/GitHubRepoPickerModal.tsx` | Post-install repo selection |
| `app/api/team/github/connect/route.ts` | Install URL (GET) and connect (POST) |
| `app/api/integrations/github/callback/route.ts` | GitHub redirect handler |
| `app/api/team/github/repos/route.ts` | List installation repos |
| `app/api/team/github/route.ts` | Read, toggle, disconnect |
| `lib/integrations/github/state.server.ts` | Signed state create/verify |
| `lib/integrations/github/install-url.server.ts` | Build install URL |
| `lib/integrations/github/app.server.ts` | Octokit / GitHub API calls |
| `lib/integrations/github/team.server.ts` | Prisma persistence |
| `lib/integrations/github/api-auth.server.ts` | Route auth guard |

## Error codes (connect POST)

| Code | HTTP | Meaning |
|------|------|---------|
| `ALREADY_CONNECTED` | 409 | Team already has a linked repo |
| `INSTALLATION_IN_USE` | 409 | Installation linked to another team |
| `FORBIDDEN` | 403 | User not on the team |
| `NOT_FOUND` | 404 | Integration missing (toggle only) |
| `INVALID_INPUT` | 400 | Bad repo name or mismatch |

## Constraints

- **One repo per team** — enforced by unique `teamId` on `TeamGitHubIntegration`.
- **One team per installation** — enforced at connect time by checking `installationId` across teams.
- **Install state is single-use by convention** — no server-side nonce store; replay within the 15-minute TTL is mitigated by user/team binding checks on callback.
