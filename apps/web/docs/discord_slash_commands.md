**IF YOU ARE AN AGENT, DO NOT MODIFY THIS FILE**

# Discord Slash Commands Guide

Complete reference for the VEXApp Discord bot’s **23** slash commands under `apps/bot/src/commands`.

Most commands require:

1. A **guild** (server) context
2. A **linked Discord account** (Discord ID stored on the platform user)
3. Membership on a **team** (except `/ping`, `/server`, and `/team`)

`/ban`, `/kick-member`, and `/timeout` are **platform** actions (database). They do **not** Discord-ban, Discord-kick, or Discord-timeout the user.

---

## Quick index by audience

| Audience | Commands |
|----------|----------|
| Anyone | `/ping`, `/server`, `/team` |
| Linked + on a team | `/verify`, `/day-plan`, `/summary`, `/events`, `/tasks`, `/create-task`, `/complete-task`, `/scout` |
| Team leader or admin | `/invite-users`, `/schedule-events`, `/timeout`, `/lift-timeout`, `/kick-member` |
| Platform admin | All `/set-*` commands, `/ban`, `/unban` |

---

## Permissions model

Shared helpers live in `apps/bot/src/utils/team-options.ts` and moderation policy in `@stlvex/database`.

| Gate | Check | Typical commands |
|------|-------|------------------|
| Anyone | No DB link required | `/ping`, `/server`, `/team`\* |
| Linked + team | Discord linked, not banned, has `teamId` | Tasks, events list, scout, verify, summary, day-plan |
| Leader or admin | `isAdmin` **or** role `TEAM_LEADER` / `ADMIN` (`canManageTeamScopedAction`) | `/invite-users`, `/schedule-events` |
| Platform admin | `isAdmin` **or** role `ADMIN` (`isPlatformAdmin`) | All `/set-*` |
| Ban / unban | `isAdmin` only (stricter than platform-admin role) | `/ban`, `/unban` |
| Timeout / kick | Admin: any non-admin; Leader: same-team `TEAM_MEMBER` only | `/timeout`, `/lift-timeout`, `/kick-member` |

\* `/team` needs the **target** user to be Discord-linked with a team; the viewer needs no special role.

Moderation rules (also):

- No self-moderation
- Cannot moderate other platform admins
- Forbidden → `"❌ You are not allowed to moderate that user."`

Audit trail for moderation writes to Postgres `ModerationEvent` (and may fan out telemetry to Discord channels when configured).

---

## First-time server setup

Run these as a **platform admin** in the Discord server, in order:

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `/set-team-server` | Bind a team to this guild (`Team.discordServerId`) |
| 2 | `/set-team-role` | Team Discord role (`Team.discordRoleId`) |
| 3 | `/set-general-member-role` | Verified-member role for this guild |
| 4 | `/set-announcements-channel` | Ops / digests / low-stock / most telemetry |
| 5 | `/set-admin-logs-channel` | Private security-style alerts |
| 6 | `/verify` (members) | Sync nickname + assign roles from the DB |

Bot needs **Manage Nicknames** and a role hierarchy above the roles it assigns.

---

## Shared mechanics

### Loading and dispatch

- `apps/bot/src/loaders.ts` recursively imports every default export under `commands/`
- Runtime dispatch: `apps/bot/src/events/interactionCreate.ts` (chat, autocomplete, modals via `customId` prefix)

### Autocomplete

| Helper / command | Behavior |
|------------------|----------|
| `autocompleteTeamOption` | Invite + team-scoped admin `/set-*` |
| `autocompleteScheduleTeamOption` | `/schedule-events` (includes **All Teams**) |
| `/complete-task` | Own-team tasks by title/id (≤25) |

### Modal-backed commands

`/create-task`, `/schedule-events`, and `/scout` open a Discord modal after the slash command.

---

## Admin / config

### `/set-team-server`

| | |
|--|--|
| **Who** | Platform admin |
| **Options** | `team` (required, autocomplete) |
| **How** | Run in the Discord server you want linked. Pick the team. |
| **Works** | Sets `Team.discordServerId = guildId`. One team per server (unique). |

### `/set-team-role`

| | |
|--|--|
| **Who** | Platform admin |
| **Options** | `team` (required, autocomplete); `role` (required) |
| **How** | Pick team + Discord role. Used by `/verify` for team role assignment. |
| **Works** | Updates `Team.discordRoleId`. Fails if another team already uses that role. |

### `/set-general-member-role`

| | |
|--|--|
| **Who** | Platform admin |
| **Options** | `role` (required) |
| **How** | Pick the base member role for **this guild** (server-scoped, not team-scoped). |
| **Works** | Upserts `DiscordGuildSettings.generalMemberRoleId`. `/verify` adds this role. |

### `/set-announcements-channel`

| | |
|--|--|
| **Who** | Platform admin |
| **Options** | `team` (required); `channel` (text or announcement) |
| **How** | Pick the channel for actionable ops notifications. |
| **Works** | Stores `Team.annoucementsChannelId` (schema typo preserved). Digests, low-stock, and most telemetry post here. |

### `/set-admin-logs-channel`

| | |
|--|--|
| **Who** | Platform admin |
| **Options** | `team` (required); `channel` (text or announcement) |
| **How** | Pick a private admin channel for sensitive alerts. |
| **Works** | Stores `Team.adminLogsChannelId`. Security telemetry routes here. |

---

## Moderation

All moderation commands are ephemeral and use `resolveActor` (guild + linked + not banned). They change the **app database**, not Discord moderation state.

### `/ban`

| | |
|--|--|
| **Who** | Platform admin (`isAdmin` only) |
| **Options** | Exactly one of `user` \| `user_id` \| `discord_id`; optional `reason` |
| **How** | Target via Discord user, platform UUID, or Discord snowflake. |
| **Works** | Sets `bannedAt`, clears `teamId` + `suppressedUntil`, writes `ModerationEvent`. Web sessions die on next `getCurrentUser`. Bot path does not immediately revoke Supabase sessions (web ban does). |
| **Notes** | Cannot ban self or other admins. |

### `/unban`

| | |
|--|--|
| **Who** | Platform admin (`isAdmin` only) |
| **Options** | Same targeting as `/ban`; optional `reason` |
| **Works** | Clears `bannedAt` + audit event. Errors if user is not banned. |

### `/timeout`

| | |
|--|--|
| **Who** | Admin or team leader (scoped) |
| **Options** | `user` (required); `hours` 1–720 (default **24**); optional `reason` |
| **How** | Puts a linked user in **app read-only** mode. |
| **Works** | `suppressUser` → `suppressedUntil` + `ModerationEvent`. Leaders: same-team `TEAM_MEMBER` only. Admins: any non-admin. |

### `/lift-timeout`

| | |
|--|--|
| **Who** | Same as `/timeout` |
| **Options** | `user` (required); optional `reason` |
| **Works** | `unsuppressUser` → `suppressedUntil = null` + audit. |

### `/kick-member`

| | |
|--|--|
| **Who** | Same as `/timeout` |
| **Options** | `user` (required); optional `reason` |
| **How** | Removes the member from their **team** (not a Discord kick). |
| **Works** | `kickUser` → `teamId = null` + audit. Fails if target is not on a team. |

---

## Tasks

### `/create-task`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | Optional `type` (Hardware/Software/CAD/Other, default **Other**); optional `priority` (Low/Medium/High, default **Medium**) |
| **How** | Choose type/priority → modal: title, description, optional due date. |
| **Works** | Creates `Task` with your `teamId` + `createdBy`. Ephemeral confirmation. |

### `/complete-task`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | `task` (required, autocomplete); `status` NotStarted/InProgress/Done (default **Done**) |
| **How** | Autocomplete picks team tasks by title/id. |
| **Works** | Updates status if same team. Errors if already that status. |

### `/tasks`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | `status`, `priority`, `task-type`, `assigned-to-me` (default **true**), `sort-by`, `sort-order` |
| **How** | Filter/sort; default shows incomplete tasks assigned to you. |
| **Works** | Queries root tasks (`parentTaskId: null`), sorts, shows up to 25 in an embed. |

---

## Events

### `/events`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | `time-range`: `week` \| `month` \| `all` (default **week**) |
| **How** | Lists upcoming events for your team. |
| **Works** | Reads `Event` rows linked to your team with `start ≥ now`. |

### `/schedule-events`

| | |
|--|--|
| **Who** | Leader or admin (`canManageTeamScopedAction`) |
| **Options** | `event-type` required (`WORK_SESSION` / `LESSON` / `TOURNAMENT` / `CHECK_IN`); optional `team` (autocomplete, includes **All Teams**) |
| **How** | Pick type (+ team) → modal: name, description, location, start, optional end (default start + 1h). |
| **Works** | Creates `Event` and connects team(s). Leaders can currently schedule for All Teams (no admin-only gate on that path). |

---

## General

### `/ping`

| | |
|--|--|
| **Who** | Anyone |
| **Options** | None |
| **Works** | Public reply `Pong!`. No DB. |

### `/server`

| | |
|--|--|
| **Who** | Anyone in a guild |
| **Options** | None |
| **Works** | Guild name + member count. No DB. |

### `/summary`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | `time-range` for events (`week` / `month` / `all`, default **week**) |
| **How** | Ephemeral personal briefing. |
| **Works** | Up to 8 incomplete assigned tasks + up to 8 upcoming team events. |

### `/day-plan`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | None |
| **How** | Shows today’s BUILD / CODING / TESTING plan if set in the app. |
| **Works** | Reads `TeamDayPlan` for today’s UTC date. |

---

## Auth

### `/verify`

| | |
|--|--|
| **Who** | Linked user with a team |
| **Options** | None |
| **How** | Run after linking Discord in the web app. |
| **Works** | Nickname `{first} {last} \| {teamNumber}` (≤32 chars). Adds team `discordRoleId` + general member role from guild settings/config. |
| **Notes** | Fails if Discord not linked, no team, or team/general roles not configured. Bot needs Manage Nicknames + role hierarchy. |

---

## Teams

### `/team`

| | |
|--|--|
| **Who** | Anyone (target must be linked with a team) |
| **Options** | Optional `user` (defaults to you) |
| **Works** | **Public** (non-ephemeral) embed: team number, role, roster mentions. Not guild-gated. |
| **Notes** | Roster is visible in-channel — not private. |

---

## Invites

### `/invite-users`

| | |
|--|--|
| **Who** | Leader or admin |
| **Options** | `team` (autocomplete; required for admins, leaders default to own); optional `expiry-date` ISO (default +7 days); optional `max-uses` (default **1**) |
| **How** | Creates `{NEXT_PUBLIC_APP_URL}/join/{id}`. Copy immediately — reply is ephemeral. |
| **Works** | Inserts `Invite` row. Leaders cannot invite to other teams. |
| **Notes** | Embed currently calls `.setDescription` three times; only the WARNING text remains visible (known bug). See also [invite_flow.md](./invite_flow.md). |

---

## Scouting

### `/scout`

| | |
|--|--|
| **Who** | Linked team member |
| **Options** | `team-number` (required, max 16) |
| **How** | Enter opponent number → modal: notes, drive 1–5, auton 1–5, mechanisms. |
| **Works** | Upserts `ScoutNote` on `(teamId, targetTeamNumber)`. Empty modal fields on update leave existing values. |

---

## Source map

| Category | Path under `apps/bot/src/commands/` |
|----------|-------------------------------------|
| Admin | `admin/` |
| Moderation | `moderation/` |
| Tasks | `tasks/` |
| Events | `events/` |
| General | `general/` |
| Auth | `auth/` |
| Teams | `teams/` |
| Invite | `invite.ts` (root) |
| Scouting | `scouting/` |

Permission helpers: `apps/bot/src/utils/team-options.ts`, `authorize-team-member.ts`, `moderation-resolve.ts`.
