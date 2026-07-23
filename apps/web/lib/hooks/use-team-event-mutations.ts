"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import {
  prependTeamEvent,
  removeTeamEvent,
  replaceTeamEvent,
} from "@/lib/queries/cache-updates/events";
import {
  createTeamEventFromApi,
  deleteTeamEventFromApi,
  updateTeamEventFromApi,
} from "@/lib/queries/events";

type UseTeamEventMutationsOptions = {
  teamId: string | undefined;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
};

export function useTeamEventMutations({
  teamId,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseTeamEventMutationsOptions) {
  const queryClient = useQueryClient();

  const invalidateDashboard = () => {
    if (teamId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.summary(teamId),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: createTeamEventFromApi,
    onSuccess: (newEvent) => {
      if (teamId) {
        prependTeamEvent(queryClient, teamId, newEvent);
      }
      onCreateSuccess?.();
    },
    onSettled: invalidateDashboard,
  });

  const updateMutation = useMutation({
    mutationFn: updateTeamEventFromApi,
    onSuccess: (updatedEvent) => {
      if (teamId) {
        replaceTeamEvent(queryClient, teamId, updatedEvent);
      }
      onUpdateSuccess?.();
    },
    onSettled: invalidateDashboard,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeamEventFromApi,
    onSuccess: (_data, eventId) => {
      if (teamId) {
        removeTeamEvent(queryClient, teamId, eventId);
      }
      onDeleteSuccess?.();
    },
    onSettled: invalidateDashboard,
  });

  return { createMutation, updateMutation, deleteMutation };
}
