# Discord Bot (Basic Setup)

This bot uses TypeScript + discord.js with a simple architecture:

- `src/commands`: Slash commands
- `src/events`: Event handlers
- `src/loaders.ts`: Dynamic loading for commands/events
- `src/deploy-commands.ts`: Slash command registration script

## 1) Environment variables

Copy `.env.example` and fill in your values:

- `DISCORD_TOKEN` (required)
- `DISCORD_CLIENT_ID` (required)
- `GENERAL_MEMBER_ROLE_ID` (required)
- `WEBHOOK_SECRET` (required)
- `DATABASE_URL` / `DIRECT_URL` (required — same values as the web app)
- `DISCORD_GUILD_ID` (optional, for guild-scoped command registration)

On Render (or any PaaS), set these in the service **Environment** tab — a `.env` file is not deployed. Render injects `PORT`; the bot prefers `PORT` over `WEBHOOK_PORT` when both are present.

## 2) Register slash commands

After adding or changing slash commands, register them with Discord:

```bash
pnpm --filter bot register:commands
```

If `DISCORD_GUILD_ID` is set, commands are registered to that guild (instant updates).
Otherwise commands are registered globally (can take up to an hour to propagate).

Locally, `pnpm --filter bot dev` runs `predev` first, which auto-registers commands before the bot starts.

## 3) Run the bot

```bash
pnpm --filter bot dev
```

Production (`pnpm --filter bot start`) does not auto-register commands — run `register:commands` explicitly when deploying command changes.

## Built-in commands

- `/ping`
- `/server`

## Production deployment

The web app and Discord bot are deployed separately:

| Service | Typical host | Role |
|---------|--------------|------|
| **web** | Netlify | Next.js dashboard, GitHub OAuth callback, team integration UI |
| **bot** | VPS / Docker (`docker-compose` `bot` service) | Discord client + webhook API on port `3001` |

Both services must use the **same** `DATABASE_URL` (and `DIRECT_URL` when applicable) so team integrations, notification preferences, and user profiles stay in sync.

### GitHub webhooks

GitHub must be able to POST events to the bot, not the Netlify-hosted web app:

```
{BOT_PUBLIC_URL}/api/github
```

Configure `BOT_PUBLIC_URL` in the bot environment (see `.env.example`). Examples:

- **Docker Compose (local / VPS):** expose `3001:3001` on the `bot` service (already set in `docker-compose.yml`), then set `BOT_PUBLIC_URL` to your public origin (e.g. `https://bot.yourdomain.com` behind a reverse proxy).
- **TLS:** terminate HTTPS at nginx/Caddy/Traefik and proxy to `bot:3001`. GitHub requires HTTPS for production webhooks.

Set `GITHUB_WEBHOOK_SECRET` to the secret configured on the GitHub App or repository webhook. The bot verifies `x-hub-signature-256` on incoming requests.

The web app uses `GITHUB_INSTALL_STATE_SECRET`, `GITHUB_APP_ID`, and related vars for the install flow; webhook delivery is handled entirely by the bot.
