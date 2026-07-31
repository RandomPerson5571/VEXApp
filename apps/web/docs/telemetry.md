# Telemetry system

Guild-scoped Discord log channels for **security**, **info**, and **inventory** events, plus **DM notifications** when tasks are assigned.

## Categories

| Category | Channel setting | What gets logged |
|----------|-----------------|------------------|
| **security** | `DiscordGuildSettings.securityLogsChannelId` | Moderation, account signups, API 5xx failures, warnings |
| **info** | `infoLogsChannelId` | Create / update / delete: tasks, events, scouting, knowledge, invites, day plans |
| **inventory** | `inventoryLogsChannelId` | Inventory item CRUD, sign-outs, returns |

**Task assignment** (separate): new assignees receive a Discord **DM** via webhook `task.assigned` (requires linked Discord).

## Architecture

```
lib/data/* mutations (post-commit)
  → logTelemetry / notifyTaskAssigned (web)
  → POST {BOT_PUBLIC_URL}/api/webhooks

Bot
  → telemetry.security | telemetry.info | telemetry.inventory
      → broadcast embed to every guild with that category channel configured
  → task.assigned → DM each assignee
```

Env: `BOT_PUBLIC_URL`, `WEBHOOK_SECRET` (header `x-webhook-secret`).

Telemetry does **not** route via `Team.discordServerId`. Any server where a platform admin runs `/set-*-logs-channel` receives all platform activity for that category. Embeds include `Team {number}` in the footer when `teamId` is known.

## Admin setup (Discord)

Platform admin, in **each** server that should receive logs:

1. `/set-security-logs-channel`
2. `/set-info-logs-channel`
3. `/set-inventory-logs-channel`

Team server binding (`/set-team-server`) is for member verify/roles — not required for logging.

## Web modules

| File | Role |
|------|------|
| `lib/telemetry/types.ts` | Category and payload types |
| `lib/telemetry/dispatch.ts` | `logTelemetry`, `notifyTaskAssigned`, `logEndpointFailure`, `logWarning` |
| `lib/telemetry/detail.ts` | `formatTelemetryDateTime`, `telemetryFields`, truncation helpers |
| `lib/telemetry/messages.ts` | Short summary lines (embed description) |
| `lib/api/route-error.ts` | Optional API error helper with security logging |

All dispatch functions are fire-and-forget; failures log to stdout only.

Discord embeds include: humanized action title, summary description, entity type/ID, actor (name, email, Discord ID), team (number + name), full date/time (local + ISO), action-specific fields, and footer action key.

## Guardrails

- Emit telemetry **after** Prisma commits, never inside `$transaction`.
- Task update assignee DMs: only **new** assignee IDs (`undefined` / `[]` → no DM).
- Bot DM handler catches Discord error `50007` (DMs disabled).

## Removed (legacy)

Daily digest buffer, routine/actionable tiers, low-stock alert loop, announcements channel, `TeamDigestBuffer`, `restockPending`, `orderPlacedAt`, per-team guild routing for log channels.
