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
- `DISCORD_GUILD_ID` (optional, for guild-scoped command registration)

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
