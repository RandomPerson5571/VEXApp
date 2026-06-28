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
  },
  events: {
    forTeam: (teamId: string) => ["events", "team", teamId] as const,
  },
  docs: {
    all: ["docs"] as const,
    detail: (id: string) => ["docs", "detail", id] as const,
  },
  notebookLogs: {
    all: ["notebook-logs"] as const,
  },
  invites: {
    all: ["invites"] as const,
  },
} as const;
