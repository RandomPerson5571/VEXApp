# apps/web — App Map

Snapshot of the STL Robotics / VEX team web app: structure, features, routes, and how pieces connect. Generated from the codebase as of 2026-07-27.

Related deep-dives (do not overwrite): [invite_flow.md](./invite_flow.md), [github_integration_flow.md](./github_integration_flow.md), [query_caching.md](./query_caching.md), [schema.md](./schema.md) → `packages/database/prisma/schema.prisma`.

---

## What it is

Next.js App Router frontend for **STL Robotics** team ops: dashboard, inventory, calendar, tasks, knowledge graph, competition scouting/picklists, invites, settings, and platform admin. Auth is **Supabase** (email + Discord). Data is **Postgres via Prisma** (`@stlvex/database`). A separate **bot** app handles Discord/GitHub webhooks.

Monorepo neighbors:

| Path | Role |
|------|------|
| `apps/web` | This app |
| `apps/bot` | Discord / GitHub webhook consumer |
| `packages/database` | Prisma schema + client |
| `packages/ui` | Shared UI helpers (`cn`, etc.) |
| `packages/api-gateway` | Shared API gateway package |

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind 4, dark-first UI |
| Auth | Supabase SSR (`@supabase/ssr`) |
| Data | Prisma / `@stlvex/database` |
| Client cache | TanStack Query v5 (RSC prefetch + hydrate) |
| Editor | TipTap (scout notes) |
| Graph | `react-force-graph-2d` |
| Motion | GSAP (`@gsap/react`) |
| CAD / SCM | Fusion 360 OAuth, GitHub App install |
| Competition | `events.vex` + RobotEvents APIs |
| Embeddings | OpenAI `text-embedding-3-small` (knowledge search) |
| Tests | Vitest (unit / integration / functional) |
| PWA-ish | `public/sw.js` + `ServiceWorkerRegistration` |

Session refresh / route protection runs through `proxy.ts` → `lib/supabase/proxy` (Next proxy matcher, not classic `middleware.ts`).

---

## Top-level layout

```
apps/web/
  app/                 # Routes, layouts, API route handlers
  components/          # Feature UI + providers + layout chrome
  lib/                 # Auth, data, queries, hooks, integrations
  docs/                # This folder
  public/              # Logos, models, service worker
  tests/               # unit | integration | functional
```

### `app/` route groups

| Group / path | Purpose |
|--------------|---------|
| `app/page.tsx` | Marketing landing |
| `(auth)/` | Login, signup, reset, update-password |
| `(dashboard)/` | Authenticated team product shell |
| `(platform-admin)/` | Global-admin-only `/admin` |
| `onboarding/` | Invite-gated profile completion |
| `join/[code]` | Invite cookie set + redirect |
| `invite-invalid/` | Bad/expired invite UX |
| `auth/callback` | Supabase OAuth / magic-link callback |
| `api/**` | REST handlers for dashboard features |

Protected prefixes (see `lib/auth/routes.ts`): `/dashboard`, `/knowledge`, `/calendar`, `/inventory`, `/invite`, `/settings`, `/task-list`, `/team-management`, `/admin`.

### `components/` by domain

| Folder | Features |
|--------|----------|
| `landing/` | Hero, sections, integrations, GSAP motion |
| `dashboard/` | Summary, tasks, calendar, matches, inventory widgets |
| `inventory/` | Item cards, filters, modal, sign-outs |
| `calendar/` | Month/week/schedule grids, events, day plans |
| `tasks/` | Task list, create modal, badges |
| `knowledge/` | Force graph, sidebar, scouting, picklist |
| `team/` | Members, roles, GitHub/Fusion connect UI |
| `invite/` | Invite creation + settings |
| `settings/` | Profile + notification prefs |
| `admin/` | Users, teams, invites, permissions tables |
| `auth/` | Forms, logout, delete account |
| `layout/` | Sidebar, header, authenticated shell |
| `providers/` | Theme, Query, User, service worker |
| `ui/` | Modal, confirmation dialog |
| `react-bits/` | Installed React Bits components |
| `seo/` | JSON-LD |

### `lib/` by concern

| Folder | Role |
|--------|------|
| `auth/` | Session, invite lifecycle, permissions, Discord identity |
| `data/` | Server-side Prisma access for domain entities |
| `queries/` | TanStack queryOptions, API fetchers, prefetch helpers, cache updates |
| `hooks/` | Client hooks wrapping queries/mutations |
| `integrations/` | GitHub App + Fusion 360 connect flows |
| `robotevents/` | Upcoming events, analytics, OPR helpers |
| `knowledge/` | Embedding text + OpenAI embeddings |
| `scouting/` | Scout-note helpers |
| `notifications/` | Preference types + server settings |
| `security/` | API rate limiting |
| `supabase/` | Browser/server clients, proxy, inventory image upload |
| `mappers/` | Calendar / events / matches shaping |
| `types/` | Shared front-end types |

---

## Product features

### 1. Landing (`/`)

Public marketing page: nav, hero, feature sections, integration logos, footer. Motion via `LandingMotion` (GSAP). Dynamically loads heavier sections.

### 2. Auth & onboarding

- **Invite-only signup** — `/join/{code}` sets invite cookie → `/onboarding`.
- Email/password + Discord OAuth; callback at `/auth/callback`.
- Onboarding creates the app `User` row and consumes the invite.
- Password reset → `/update-password`.
- Details: [invite_flow.md](./invite_flow.md).

### 3. Dashboard (`/dashboard`)

Team home widgets:

- Summary stats
- Task list preview (warms full task cache)
- Calendar snippet
- Upcoming RobotEvents matches
- Inventory tracker

Server prefetch + client hydration (see [query_caching.md](./query_caching.md)).

### 4. Inventory (`/inventory`)

Workshop parts tracker:

- CRUD items (qty, location, notes, images via Supabase storage)
- Sign-out / return tracking
- Search + availability filters
- Stats summary

APIs: `/api/inventory`, `/api/inventory/[itemId]`, sign-outs, upload, signed URLs.

### 5. Calendar (`/calendar`)

Merged team calendar:

- Custom **events** (build/meeting/etc.)
- **Day plans** (focus tags per day)
- RobotEvents competition dates (read-only when sourced from RE)
- Month / week / schedule modes + side panel
- Roster managers can mark events as all-teams

APIs: `/api/events`, `/api/day-plans`, `/api/robotevents/*`.

### 6. Task list (`/task-list`)

Team tasks with assignees, priority, status, type filters; create/edit modal. Optimistic mutations → dashboard invalidation.

APIs: `/api/tasks`, `/api/tasks/[taskId]`, `/api/dashboard/tasks`.

### 7. Knowledge graph (`/knowledge`)

Interactive node/edge graph:

- Create/update/delete nodes and edges
- Semantic **search** via OpenAI embeddings
- Force-graph canvas + sidebar editor

APIs: `/api/knowledge/nodes`, `/edges`, `/search`.

### 8. Scouting (`/knowledge/scouting`)

Competition scouting for alliance picklists:

- Scout notes (drive rating, auton reliability, mechanisms, TipTap body)
- Debounced autosave
- Picklist board (ranked + do-not-pick) with DnD (`@dnd-kit`)
- RobotEvents picklist event helpers

APIs: `/api/knowledge/scouting`, `/[noteId]`, `/reorder`.

### 9. Team management (`/team-management`)

- Roster view / edit roles & status (leaders)
- Delegate team leader
- **GitHub App** connect → repo picker
- **Fusion 360** connect → project picker

APIs: `/api/team-members`, `/api/team/delegate-leader`, `/api/team/github/*`, `/api/team/fusion/*`, OAuth callbacks under `/api/integrations/*`.

### 10. Invites (`/invite`)

Visible when `canCreateInvites`. Create/manage invite links (max uses, expiry). See [invite_flow.md](./invite_flow.md).

API: `/api/auth/create-invite`.

### 11. Settings (`/settings`)

- **Profile** — name, Discord link, account delete
- **Notifications** — preference toggles (Discord-oriented)

Routes also expose `/settings/profile` and `/settings/notifications`. APIs: `/api/profile`, `/api/profile/discord`, `/api/profile/notifications`.

### 12. Platform admin (`/admin`)

Global admins only (`isAdmin` / `isGlobalAdmin`). Layout redirects others to `/dashboard`.

- User list + role/admin flags
- Team CRUD
- Invite management
- Permission toggles

APIs: `/api/admin/*` (create/update/delete team, update user, delete invite, toggle-perms).

---

## Permissions (summary)

From `lib/auth/auth-guards.ts`:

| Helper | Who |
|--------|-----|
| `isGlobalAdmin` | `User.isAdmin` |
| `canViewTeamRoster` | Same-team or global |
| `canManageTeamRoster` | Team leader / admin scope |
| `canManageTeamIntegrations` | Any same-team member or global |
| `canDelegateTeamLeaders` | Team leaders / global |
| `canCreateInvites` | Leaders / invite-capable roles |

Roles in DB: `TEAM_MEMBER`, `TEAM_LEADER`, `ADMIN` (plus `isAdmin` flag for platform).

---

## API surface (by area)

```
/api/dashboard/summary|tasks
/api/tasks|/api/tasks/[taskId]
/api/inventory|...|upload|signed-urls|sign-outs
/api/events|/api/events/[eventId]
/api/day-plans
/api/knowledge/nodes|edges|search|scouting...
/api/robotevents/upcoming|picklist-events|event-analytics
/api/team-members
/api/team/github|fusion|delegate-leader
/api/integrations/github|fusion/callback
/api/profile|discord|notifications
/api/auth/create-invite
/api/admin/...
```

Most routes: session check → permission → `lib/data/*` → JSON. Rate limiting via `lib/security/enforce-api-rate-limit`.

---

## Data model (app-relevant)

Prisma models used by web (full schema in `packages/database`):

`User`, `NotificationSettings`, `DiscordAccount`, `Team`, `Invite`, `Task` / `TaskAssignment`, `InventoryItem` / `InventoryItemSignOut`, `Event`, `TeamDayPlan`, `KnowledgeNode` / `KnowledgeEdge`, `ScoutNote`, `TeamGitHubIntegration`, `TeamFusionIntegration`, plus Discord guild settings (bot-leaning).

---

## Data flow pattern

```
RSC page → getCurrentUser → prefetch (lib/queries/prefetch-*)
         → dehydrate → HydrationBoundary
Client   → useTeam* hooks → /api/* → lib/data/* → Prisma
Mutations → optimistic/cache patch → invalidate related keys
```

Details: [query_caching.md](./query_caching.md).

---

## Sidebar navigation

Order in `components/layout/Sidebar.tsx`:

1. Dashboard  
2. Inventory  
3. Calendar  
4. Task List  
5. Knowledge  
6. Scouting  
7. Members  
8. Invites (conditional)  
9. Settings  
10. Admin (global admin footer link)

---

## Tests

| Kind | Path | Focus |
|------|------|-------|
| Unit | `tests/unit/` | Auth, API handlers, data, integrations, hooks, mappers |
| Integration | `tests/integration/` | DB-backed flows (inventory, invite, onboarding, Fusion, admin) |
| Functional | `tests/functional/` | React component flows (e.g. inventory create) |

Run: `pnpm test` / `pnpm test:watch` from `apps/web`.

---

## Notable gaps / adjacent systems

- **Bot** (`apps/bot`) owns Discord notifications and GitHub webhook fan-out after web connects integrations.
- **Notion / Onshape** logos appear on landing; not wired as first-class integrations in `lib/integrations/` (only GitHub + Fusion).
- Root `README.md` is still create-next-app boilerplate — this map is the real overview.
- `docs/schema.md` is a pointer only; do not edit it for schema changes.

---

## Quick “where do I change X?”

| Want to change… | Start here |
|-----------------|------------|
| Nav items | `components/layout/Sidebar.tsx` |
| Landing hero / motion | `components/landing/*` |
| Auth / invite rules | `lib/auth/*`, `docs/invite_flow.md` |
| Dashboard widgets | `components/dashboard/*` |
| Inventory UX | `components/inventory/*`, `lib/data/inventory.ts` |
| Calendar merge logic | `lib/hooks/use-merged-calendar-sources.ts` |
| Scouting autosave | `components/knowledge/ScoutingView.tsx`, `lib/constants/request-timing.ts` |
| Knowledge embeddings | `lib/knowledge/embeddings.ts` |
| GitHub connect | `lib/integrations/github/*`, `docs/github_integration_flow.md` |
| Fusion connect | `lib/integrations/fusion/*` |
| Admin tables | `components/admin/*`, `app/(platform-admin)/admin` |
| Query stale times | `lib/query-client.ts`, `docs/query_caching.md` |
