"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import { prependTeamEvent } from "@/lib/queries/cache-updates/events";
import { createTeamEventFromApi } from "@/lib/queries/events";

type UseTeamEventMutationsOptions = {
  teamId: string | undefined;
  onCreateSuccess?: () => void;
};

export function useTeamEventMutations({
  teamId,
  onCreateSuccess,
}: UseTeamEventMutationsOptions) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTeamEventFromApi,
    onSuccess: (newEvent) => {
      if (teamId) {
        prependTeamEvent(queryClient, teamId, newEvent);
      }
      onCreateSuccess?.();
    },
    onSettled: () => {
      if (teamId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.summary(teamId),
        });
      }
    },
  });

  return { createMutation };
}
