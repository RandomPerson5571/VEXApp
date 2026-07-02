import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryKeys = {
  teams: {
    all: ["teams"] as const,
    detail: (id: string) => ["teams", "detail", id] as const,
    members: (teamId: string) => ["teams", "members", teamId] as const,
  },
  events: {
    forTeam: (teamId: string) => ["events", "team", teamId] as const,
  },
  tasks: {
    forTeam: (teamId: string) => ["tasks", "team", teamId] as const,
  },
  inventory: {
    forTeam: (teamId: string) => ["inventory", "team", teamId] as const,
  },
  dashboard: {
    summary: (teamId: string) => ["dashboard", "summary", teamId] as const,
    tasks: (teamId: string, limit = 4) =>
      ["dashboard", "tasks", teamId, limit] as const,
  },
  docs: {
    tree: (teamId: string) => ["docs", "tree", teamId] as const,
    detail: (id: string) => ["docs", "detail", id] as const,
  },
  notebookLogs: {
    all: ["notebook-logs"] as const,
  },
  invites: {
    all: ["invites"] as const,
  },
} as const;
