# RobotEvents / VEX Events API (`events.vex`)

Reference for using the [`events.vex`](https://github.com/Jerrylum/events.vex) package in **api-server**. This is the maintained TypeScript client for the [VEX Events API v2](https://events.vex.com/api/v2).

> **Package:** `events.vex@^7.0.0` (successor to the `robotevents` npm package)  
> **API host:** `https://events.vex.com/api/v2`  
> **Public site:** `https://events.vex.com`

---

## Table of contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Client setup in api-server](#client-setup-in-api-server)
4. [Response handling](#response-handling)
5. [High-level API (`client.*`)](#high-level-api-client)
6. [Wrapper classes](#wrapper-classes)
7. [Low-level API (`client.api`)](#low-level-api-clientapi)
8. [Constants and helpers](#constants-and-helpers)
9. [REST endpoints reference](#rest-endpoints-reference)
10. [Pagination](#pagination)
11. [Local type definitions](#local-type-definitions)
12. [Migration from `robotevents`](#migration-from-robotevents)
13. [Common recipes](#common-recipes)
14. [External links](#external-links)

---

## Overview

`events.vex` wraps the VEX Events REST API with:

- A typed **`Client()`** factory with domain helpers (`events`, `teams`, `programs`, `seasons`)
- **Wrapper classes** (`Event`, `Team`, `Match`) that expose nested resources and utilities
- A low-level **`client.api`** OpenAPI client (`openapi-fetch`) for direct path access
- Built-in **pagination unwrapping** on search/list endpoints (returns `data[]` instead of `{ meta, data }`)

The api-server depends on this package in `package.json` and is intended to proxy or enrich VEX competition data for the STL VEX web app and Discord bot.

---

## Authentication

Requests require a **Bearer token** issued from [events.vex.com](https://events.vex.com) (Account → API Access).

| Variable        | Location              | Purpose                          |
|-----------------|-----------------------|----------------------------------|
| `VEX_API_TOKEN` | `apps/api-server/.env` | JWT bearer token for API calls |

The client sends:

```
Authorization: Bearer <VEX_API_TOKEN>
```

**Never commit tokens.** `VEX_API_TOKEN` is declared in `src/environment.d.ts`.

To obtain a token: log in at events.vex.com → profile/settings → API Access → generate token.

---

## Client setup in api-server

Recommended singleton pattern:

```typescript
import { Client, programs } from "events.vex";
import type { VexEventsClient } from "events.vex";

let client: VexEventsClient | undefined;

export function getVexClient(): VexEventsClient {
  if (!client) {
    const token = process.env.VEX_API_TOKEN;
    if (!token) {
      throw new Error("VEX_API_TOKEN is not set");
    }
    client = Client({
      authorization: { token },
    });
  }
  return client;
}
```

Optional `request` overrides (timeouts, custom headers):

```typescript
Client({
  authorization: { token },
  request: {
    headers: { "User-Agent": "stlvex-api-server/1.0" },
  },
});
```

---

## Response handling

Endpoints return a **discriminated union** — always check `error` before using `data`:

```typescript
const result = await client.events.get(12345);

if (result.error) {
  // result.error has API error shape; result.response is the fetch Response
  console.error(result.response.status, result.error);
  return;
}

const event = result.data; // Event wrapper instance
```

| Field        | When present | Description                                      |
|--------------|--------------|--------------------------------------------------|
| `data`       | Success      | Parsed payload (often a wrapper class instance)  |
| `error`      | Failure      | API error object (`code`, `message`)             |
| `response`   | Always       | Raw `Response` (status, headers)                 |

`getByNumber` / `getBySKU` return `data: null` when no match is found (not necessarily an error).

---

## High-level API (`client.*`)

### `client.events`

| Method | Returns | Description |
|--------|---------|-------------|
| `search(query?)` | `Event[]` | Search events with filters |
| `get(id)` | `Event` | Get event by numeric ID |
| `getBySKU(sku)` | `Event \| null` | Get event by SKU (e.g. `RE-VRC-23-1488`) |

**`search` query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id[]` | `number[]` | Event IDs |
| `sku[]` | `string[]` | Event SKUs |
| `team[]` | `number[]` | Team IDs registered at event |
| `season[]` | `number[]` | Season IDs |
| `start` | `string` | ISO date-time — events starting on/after |
| `end` | `string` | ISO date-time — events ending on/before |
| `region` | `string` | Region filter |
| `level[]` | `EventLevel[]` | `World`, `National`, `State`, `Signature`, `Other` |
| `myEvents` | `boolean` | Events tied to authenticated user |
| `eventTypes[]` | `EventType[]` | `tournament`, `league`, `workshop`, `virtual` |

### `client.teams`

| Method | Returns | Description |
|--------|---------|-------------|
| `search(query?)` | `Team[]` | Search teams |
| `get(id)` | `Team` | Get team by numeric ID |
| `getByNumber(number, program)` | `Team \| null` | Get team by number + program code |

**`search` query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id[]` | `number[]` | Team IDs |
| `number[]` | `string[]` | Team numbers (e.g. `3796B`) |
| `event[]` | `number[]` | Event IDs |
| `registered` | `boolean` | Registration status |
| `program[]` | `number[]` | Program IDs |
| `grade[]` | `Grade[]` | `College`, `High School`, `Middle School`, `Elementary School` |
| `country[]` | `string[]` | Country codes |
| `myTeams` | `boolean` | Teams tied to authenticated user |

### `client.programs`

| Method | Returns | Description |
|--------|---------|-------------|
| `get(id)` | `Program` | Program details |
| `all(query?)` | `Program[]` | List programs (`id[]` filter) |

**Program constants** (also exported as `programs`):

| Key | ID | Competition |
|-----|----|-------------|
| `V5RC` | 1 | V5 Robotics Competition |
| `VURC` | 4 | VEX U Robotics Competition |
| `VIQRC` | 41 | VEX IQ Robotics Competition |
| `WORKSHOP` | 37 | Workshops |
| `NRL` | 43 | National Robotics League |
| `ADC` | 44 | Aerial Drone Competition |
| `TVRC` | 46 | VEX AI Robotics Competition |
| `TVIQRC` | 47 | VEX AI IQ Robotics Competition |
| `VRAD` | 51 | VEX Robotics AI Division |
| `BellAVR` | 55 | Bell AVR |
| `FAC` | 56 | Factory Automation Competition |
| `VAIRC` | 57 | VEX AI Robotics Competition |

### `client.seasons`

| Method | Returns | Description |
|--------|---------|-------------|
| `get(id)` | `Season` | Season details |
| `all(query?)` | `Season[]` | List seasons |
| `events(id, query?)` | `Event[]` | Events in a season |

**`all` query parameters:** `id[]`, `program[]`, `team[]`, `start`, `end`, `active`

**Season ID lookup** — use `client.seasons[programId][year]` or exported `seasons` constant:

```typescript
import { programs, seasons } from "events.vex";

const v5rcCurrentSeasonId = seasons[programs.V5RC]["2025-2026"]; // 197
```

---

## Wrapper classes

High-level methods return **wrapper instances** with extra methods. Raw JSON is available via `getData()` / `toJSON()`.

### `Event`

| Property / method | Description |
|-------------------|-------------|
| `id`, `sku`, `name`, `start`, `end` | Core event fields |
| `season`, `program` | `IdInfo` objects |
| `location`, `locations`, `divisions` | Venue and division data |
| `level`, `ongoing`, `awards_finalized`, `event_type` | Status metadata |
| `getURL()` | `https://events.vex.com/{sku}.html` |
| `teams(query?)` | Teams at this event |
| `skills(query?)` | Skills runs (`team[]`, `type[]`: `driver` \| `programming`) |
| `awards(query?)` | Event awards |
| `matches(divisionId, query?)` | Division matches → `Match[]` |
| `rankings(divisionId, query?)` | Division rankings |
| `finalistRankings(divisionId, query?)` | VIQRC finalist rankings |

### `Team`

| Property / method | Description |
|-------------------|-------------|
| `id`, `number`, `team_name`, `robot_name`, `organization` | Team identity |
| `location`, `registered`, `program`, `grade` | Registration metadata |
| `getURL()` | `https://events.vex.com/teams/{program}/{number}` |
| `events(query?)` | Events this team attended |
| `matches(query?)` | Team match history |
| `rankings(query?)` | Rankings across events |
| `skills(query?)` | Skills runs |
| `awards(query?)` | Awards won |

### `Match`

| Property / method | Description |
|-------------------|-------------|
| `round`, `instance`, `matchnum`, `name` | Match identity |
| `alliances` | Red/blue alliances with scores and teams |
| `scored`, `scheduled`, `started`, `field` | Match state |
| `alliance(color)` | Get red or blue alliance |
| `allianceOutcome()` | `{ winner, loser }` or null if unscored/tied |
| `teamOutcome(teamNumber)` | `"win"` \| `"loss"` \| `"tie"` \| `"unscored"` |
| `teams()` | All playing teams (excludes sitting) |
| `shortName()` | Compact label (`Q 23`, `SF 2-1`, `F 1-3`, etc.) |

**Round constants** (`rounds` export):

| Name | Value |
|------|-------|
| Practice | 1 |
| Qualification | 2 |
| Quarterfinals | 3 |
| Semifinals | 4 |
| Finals | 5 |
| RoundOf16 | 6 |
| TopN | 15 |
| RoundRobin | 16 |

---

## Low-level API (`client.api`)

For endpoints not wrapped by helpers, use the underlying OpenAPI client:

```typescript
const { data, error } = await client.api.GET("/seasons/{id}", {
  params: { path: { id: 197 } },
});
```

**Auto-pagination** — fetch all pages of a paginated endpoint:

```typescript
const { data, error } = await client.api.PaginatedGET("/teams", {
  params: {
    query: {
      "program[]": [programs.V5RC],
      registered: true,
    },
  },
});
// data is a flat Team[] (up to 250 per page, loops until exhausted)
```

`PaginatedGET` uses `per_page: 250` and follows `meta.next_page_url` until all records are collected.

---

## REST endpoints reference

All paths are relative to `https://events.vex.com/api/v2`.

| Method | Path | Wrapped by |
|--------|------|------------|
| GET | `/events` | `client.events.search` |
| GET | `/events/{id}` | `client.events.get` |
| GET | `/events/{id}/teams` | `event.teams()` |
| GET | `/events/{id}/skills` | `event.skills()` |
| GET | `/events/{id}/awards` | `event.awards()` |
| GET | `/events/{id}/divisions/{div}/matches` | `event.matches(div)` |
| GET | `/events/{id}/divisions/{div}/rankings` | `event.rankings(div)` |
| GET | `/events/{id}/divisions/{div}/finalistRankings` | `event.finalistRankings(div)` |
| GET | `/teams` | `client.teams.search` |
| GET | `/teams/{id}` | `client.teams.get` |
| GET | `/teams/{id}/events` | `team.events()` |
| GET | `/teams/{id}/matches` | `team.matches()` |
| GET | `/teams/{id}/rankings` | `team.rankings()` |
| GET | `/teams/{id}/skills` | `team.skills()` |
| GET | `/teams/{id}/awards` | `team.awards()` |
| GET | `/programs` | `client.programs.all` |
| GET | `/programs/{id}` | `client.programs.get` |
| GET | `/seasons` | `client.seasons.all` |
| GET | `/seasons/{id}` | `client.seasons.get` |
| GET | `/seasons/{id}/events` | `client.seasons.events` |

---

## Pagination

The raw API returns Laravel-style pagination:

```json
{
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 50,
    "total": 230,
    "next_page_url": "...",
    "prev_page_url": null
  },
  "data": [ /* ... */ ]
}
```

**High-level search methods** (`events.search`, `teams.search`, etc.) automatically unwrap pagination and return a flat array.

**Raw paginated responses** (e.g. `event.skills()`, `event.awards()`) still return `{ meta, data }` via `openapi-fetch`.

Local mirror types live in `src/types/pagination/`:

- `VexPaginationMeta` — pagination metadata
- `RobotEventsPaginatedResponse<T>` — `{ meta, data: T[] }`
- `PaginatedTeam`, `PaginatedEvent`, etc. — typed aliases for each resource

---

## Local type definitions

The api-server maintains **response shape types** under `src/types/` that mirror the VEX API. Use these when defining api-server routes or mapping to the database — they are separate from the `events.vex` package types.

| Local type | Package equivalent | Path |
|------------|-------------------|------|
| `VexEventResponse` | `EventData` | `src/types/event/Event.ts` |
| `VexTeamResponse` | `TeamData` | `src/types/team/Team.ts` |
| `VexMatchResponse` | `MatchData` | `src/types/match/Match.ts` |
| `VexRankingResponse` | `Ranking` | `src/types/rankings/Ranking.ts` |
| `VexSkillResponse` | `Skill` | `src/types/skills/Skill.ts` |
| `VexAwardResponse` | `Award` | `src/types/award/Award.ts` |
| `VexSeasonResponse` | `Season` | `src/types/season/Season.ts` |

You can also import types directly from `events.vex`:

```typescript
import type { EventData, TeamData, MatchData, ProgramCode } from "events.vex";
```

**Note:** Local `EventType` in `src/types/event/EventType.ts` uses PascalCase (`"Tournament"`) while the API/package uses lowercase (`"tournament"`). Prefer package types when calling `events.vex`; normalize when mapping to local types.

---

## Migration from `robotevents`

| | `robotevents` (legacy) | `events.vex` (current) |
|---|------------------------|------------------------|
| npm package | `robotevents` | `events.vex` |
| API base | `https://www.robotevents.com/api/v2` | `https://events.vex.com/api/v2` |
| Event URLs | `robotevents.com/{sku}.html` | `events.vex.com/{sku}.html` |
| Client type | `RobotEventsClient` (deprecated) | `VexEventsClient` |

Import change:

```typescript
// before
import { Client } from "robotevents";

// after
import { Client } from "events.vex";
```

The v6 `Client()` API is unchanged. v5 APIs (`setBearer`, global helpers) are **not** supported.

---

## Common recipes

### Look up a V5RC team and its upcoming events

```typescript
import { Client, programs } from "events.vex";

const client = Client({ authorization: { token: process.env.VEX_API_TOKEN! } });

const teamResult = await client.teams.getByNumber("3796B", programs.V5RC);
if (teamResult.error || !teamResult.data) return;

const eventsResult = await teamResult.data.events({
  start: new Date().toISOString(),
});
if (!eventsResult.error) {
  for (const event of eventsResult.data) {
    console.log(event.sku, event.name, event.getURL());
  }
}
```

### Find events by SKU

```typescript
const result = await client.events.search({
  "sku[]": ["RE-VRC-25-1234"],
});
```

### Get qualification matches for a division

```typescript
const eventResult = await client.events.getBySKU("RE-VRC-25-1234");
if (!eventResult.data) return;

const divisionId = eventResult.data.divisions?.[0]?.id;
if (!divisionId) return;

const matchesResult = await eventResult.data.matches(divisionId, {
  "round[]": [2], // Qualification
});

for (const match of matchesResult.data ?? []) {
  console.log(match.shortName(), match.allianceOutcome());
}
```

### Current season events for V5RC

```typescript
import { programs, seasons } from "events.vex";

const seasonId = seasons[programs.V5RC]["2025-2026"];
const result = await client.seasons.events(seasonId, {
  "level[]": ["State", "Signature"],
});
```

---

## External links

- [VEX Events API v2 docs](https://events.vex.com/api/v2)
- [events.vex package (GitHub)](https://github.com/Jerrylum/events.vex)
- [Upstream robotevents (GitHub)](https://github.com/brenapp/robotevents)
- [events.vex npm](https://www.npmjs.com/package/events.vex)

---

*Last updated for `events.vex@7.0.0`. When upgrading the package, re-check type definitions in `node_modules/events.vex/out/` and update this doc if endpoints or constants change.*
