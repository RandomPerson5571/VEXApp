# Telemetry system

Guild-scoped Discord log channels for **security**, **info**, and **inventory** events, plus **DM notifications** when tasks are assigned.

## Categories

| Category | Channel setting | What gets logged |
|----------|-----------------|------------------|
| **security** | `DiscordGuildSettings.securityLogsChannelId` | Moderation, API 5xx failures, warnings |
| **info** | `infoLogsChannelId` | Create / update / delete: tasks, events, scouting, knowledge, invites, day plans |
| **inventory** | `inventoryLogsChannelId` | Inventory item CRUD, sign-outs, returns |

**Task assignment** (separate): new assignees receive a Discord **DM** via webhook `task.assigned` (requires linked Discord).

## Architecture

```
lib/data/* mutations (post-commit)
  → logTelemetry / notifyTaskAssigned (web)
  → POST {BOT_PUBLIC_URL}/api/webhooks

Bot
  → telemetry.security | telemetry.info | telemetry.inventory → guild channel embeds
  → task.assigned → DM each assignee
```

Env: `BOT_PUBLIC_URL`, `WEBHOOK_SECRET` (header `x-webhook-secret`).

## Admin setup (Discord)

Platform admin, run in the target server:

1. `/set-security-logs-channel`
2. `/set-info-logs-channel`
3. `/set-inventory-logs-channel`

Also required for routing: `/set-team-server` binds `Team.discordServerId`.

## Web modules

| File | Role |
|------|------|
| `lib/telemetry/types.ts` | Category and payload types |
| `lib/telemetry/dispatch.ts` | `logTelemetry`, `notifyTaskAssigned`, `logEndpointFailure`, `logWarning` |
| `lib/telemetry/resolve.ts` | `resolveGuildIdForTeam` with 5-minute TTL cache |
| `lib/telemetry/messages.ts` | Human-readable log lines |
| `lib/api/route-error.ts` | Optional API error helper with security logging |

All dispatch functions are fire-and-forget; failures log to stdout only.

## Guardrails

- Emit telemetry **after** Prisma commits, never inside `$transaction`.
- Task update assignee DMs: only **new** assignee IDs (`undefined` / `[]` → no DM).
- Bot DM handler catches Discord error `50007` (DMs disabled).

## Removed (legacy)

Daily digest buffer, routine/actionable tiers, low-stock alert loop, announcements channel, `TeamDigestBuffer`, `restockPending`, `orderPlacedAt`.
