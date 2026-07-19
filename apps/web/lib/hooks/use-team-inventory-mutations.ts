"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import {
  prependTeamInventoryItem,
  replaceTeamInventoryItem,
} from "@/lib/queries/cache-updates/inventory";
import {
  createInventoryItemFromApi,
  returnInventorySignOutFromApi,
  signOutInventoryItemFromApi,
} from "@/lib/queries/inventory";

type UseTeamInventoryMutationsOptions = {
  teamId: string | undefined;
  onCreateSuccess?: () => void;
};

export function useTeamInventoryMutations({
  teamId,
  onCreateSuccess,
}: UseTeamInventoryMutationsOptions) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createInventoryItemFromApi,
    onSuccess: (newItem) => {
      if (teamId) {
        prependTeamInventoryItem(queryClient, teamId, newItem);
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

  const signOutMutation = useMutation({
    mutationFn: signOutInventoryItemFromApi,
    onSuccess: (updatedItem) => {
      if (teamId) {
        replaceTeamInventoryItem(queryClient, teamId, updatedItem);
      }
    },
    onSettled: () => {
      if (teamId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.summary(teamId),
        });
      }
    },
  });

  const returnMutation = useMutation({
    mutationFn: returnInventorySignOutFromApi,
    onSuccess: (updatedItem) => {
      if (teamId) {
        replaceTeamInventoryItem(queryClient, teamId, updatedItem);
      }
    },
    onSettled: () => {
      if (teamId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.summary(teamId),
        });
      }
    },
  });

  return { createMutation, signOutMutation, returnMutation };
}
