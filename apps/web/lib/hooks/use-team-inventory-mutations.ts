"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import {
  prependTeamInventoryItem,
  removeTeamInventoryItem,
  replaceTeamInventoryItem,
} from "@/lib/queries/cache-updates/inventory";
import {
  createInventoryItemFromApi,
  deleteInventoryItemFromApi,
  returnInventorySignOutFromApi,
  signOutInventoryItemFromApi,
  updateInventoryItemFromApi,
} from "@/lib/queries/inventory";

type UseTeamInventoryMutationsOptions = {
  teamId: string | undefined;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
};

export function useTeamInventoryMutations({
  teamId,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseTeamInventoryMutationsOptions) {
  const queryClient = useQueryClient();

  const invalidateDashboard = () => {
    if (teamId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.summary(teamId),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: createInventoryItemFromApi,
    onSuccess: (newItem) => {
      if (teamId) {
        prependTeamInventoryItem(queryClient, teamId, newItem);
      }
      onCreateSuccess?.();
    },
    onSettled: invalidateDashboard,
  });

  const updateMutation = useMutation({
    mutationFn: updateInventoryItemFromApi,
    onSuccess: (updatedItem) => {
      if (teamId) {
        replaceTeamInventoryItem(queryClient, teamId, updatedItem);
      }
      onUpdateSuccess?.();
    },
    onSettled: invalidateDashboard,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItemFromApi,
    onSuccess: (_data, itemId) => {
      if (teamId) {
        removeTeamInventoryItem(queryClient, teamId, itemId);
      }
      onDeleteSuccess?.();
    },
    onSettled: invalidateDashboard,
  });

  const signOutMutation = useMutation({
    mutationFn: signOutInventoryItemFromApi,
    onSuccess: (updatedItem) => {
      if (teamId) {
        replaceTeamInventoryItem(queryClient, teamId, updatedItem);
      }
    },
    onSettled: invalidateDashboard,
  });

  const returnMutation = useMutation({
    mutationFn: returnInventorySignOutFromApi,
    onSuccess: (updatedItem) => {
      if (teamId) {
        replaceTeamInventoryItem(queryClient, teamId, updatedItem);
      }
    },
    onSettled: invalidateDashboard,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    signOutMutation,
    returnMutation,
  };
}
