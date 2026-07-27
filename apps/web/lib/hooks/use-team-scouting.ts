"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import { SCOUTING_PICKLIST_DELAY_MS } from "@/lib/constants/request-timing";
import { useDebouncedMutation } from "@/lib/hooks/use-debounced-mutation";
import {
  applyScoutNotePatch,
  optimisticallyPatchScoutNote,
  optimisticallyReorderScoutNotes,
  replaceScoutNotesCache,
} from "@/lib/queries/cache-updates/scouting";
import {
  createScoutNoteFromApi,
  deleteScoutNoteFromApi,
  reorderScoutNotesFromApi,
  scoutNotesQueryOptions,
  updateScoutNoteFromApi,
  type CreateScoutNotePayload,
  type ReorderScoutNotesPayload,
  type ScoutNoteRecord,
  type UpdateScoutNotePayload,
} from "@/lib/queries/scouting";
import { queryKeys } from "@/lib/query-client";
import { debounce } from "@/lib/utils/debounce";

export function useTeamScouting() {
  const team = useTeam();
  const teamId = team?.id ?? "";
  const notesQuery = useQuery(scoutNotesQueryOptions(teamId));

  return {
    teamId,
    notes: notesQuery.data ?? [],
    notesQuery,
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
  };
}

export function useScoutingMutations(teamId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.knowledge.scouting(teamId);

  const reorderRollbackRef = useRef<ScoutNoteRecord[] | undefined>(undefined);
  const crossOffRollbackRef = useRef<ScoutNoteRecord[] | undefined>(undefined);
  const latestCrossOffRef = useRef(new Map<string, boolean>());
  const crossOffDebouncersRef = useRef(
    new Map<string, ReturnType<typeof debounce<() => void>>>(),
  );

  useEffect(() => {
    const debouncers = crossOffDebouncersRef.current;
    return () => {
      for (const debounced of debouncers.values()) {
        debounced.cancel();
      }
      debouncers.clear();
      latestCrossOffRef.current.clear();
    };
  }, []);

  const createNote = useMutation({
    mutationFn: (payload: CreateScoutNotePayload) =>
      createScoutNoteFromApi(payload),
    onSuccess: (note) => {
      queryClient.setQueryData<ScoutNoteRecord[]>(queryKey, (old) =>
        old ? [...old, note] : [note],
      );
    },
  });

  const updateNote = useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: UpdateScoutNotePayload;
    }) => updateScoutNoteFromApi(noteId, payload),
    onMutate: async ({ noteId, payload }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ScoutNoteRecord[]>(queryKey);
      optimisticallyPatchScoutNote(queryClient, teamId, noteId, payload);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (note) => {
      applyScoutNotePatch(queryClient, teamId, note);
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => deleteScoutNoteFromApi(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ScoutNoteRecord[]>(queryKey);
      queryClient.setQueryData<ScoutNoteRecord[]>(queryKey, (old) =>
        old ? old.filter((note) => note.id !== noteId) : old,
      );
      return { previous };
    },
    onError: (_error, _noteId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });

  // Keep immediate mutate for rare callers; picklist UI uses scheduleReorder.
  const reorderNotes = useMutation({
    mutationFn: (payload: ReorderScoutNotesPayload) =>
      reorderScoutNotesFromApi(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ScoutNoteRecord[]>(queryKey);
      optimisticallyReorderScoutNotes(
        queryClient,
        teamId,
        payload.orderedNoteIds,
        payload.dnpNoteIds ?? [],
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (notes) => {
      replaceScoutNotesCache(queryClient, teamId, notes);
    },
  });

  const applyReorderOptimistic = useCallback(
    (payload: ReorderScoutNotesPayload) => {
      if (reorderRollbackRef.current === undefined) {
        reorderRollbackRef.current =
          queryClient.getQueryData<ScoutNoteRecord[]>(queryKey);
      }
      optimisticallyReorderScoutNotes(
        queryClient,
        teamId,
        payload.orderedNoteIds,
        payload.dnpNoteIds ?? [],
      );
    },
    [queryClient, queryKey, teamId],
  );

  const {
    mutate: scheduleReorder,
    isPending: isReorderPending,
  } = useDebouncedMutation<ReorderScoutNotesPayload>({
    delayMs: SCOUTING_PICKLIST_DELAY_MS,
    applyOptimistic: applyReorderOptimistic,
    mutateFn: async (payload) => {
      const notes = await reorderScoutNotesFromApi(payload);
      replaceScoutNotesCache(queryClient, teamId, notes);
      reorderRollbackRef.current = undefined;
    },
    onError: () => {
      if (reorderRollbackRef.current !== undefined) {
        queryClient.setQueryData(queryKey, reorderRollbackRef.current);
        reorderRollbackRef.current = undefined;
      }
    },
  });

  const scheduleCrossOff = useCallback(
    (noteId: string, crossedOff: boolean) => {
      if (crossOffRollbackRef.current === undefined) {
        crossOffRollbackRef.current =
          queryClient.getQueryData<ScoutNoteRecord[]>(queryKey);
      }

      optimisticallyPatchScoutNote(queryClient, teamId, noteId, {
        crossedOff,
      });
      latestCrossOffRef.current.set(noteId, crossedOff);

      let debounced = crossOffDebouncersRef.current.get(noteId);
      if (!debounced) {
        debounced = debounce(() => {
          const next = latestCrossOffRef.current.get(noteId);
          if (next === undefined) return;

          void updateScoutNoteFromApi(noteId, { crossedOff: next })
            .then((note) => {
              applyScoutNotePatch(queryClient, teamId, note);
              latestCrossOffRef.current.delete(noteId);
              if (latestCrossOffRef.current.size === 0) {
                crossOffRollbackRef.current = undefined;
              }
            })
            .catch(() => {
              if (crossOffRollbackRef.current !== undefined) {
                queryClient.setQueryData(
                  queryKey,
                  crossOffRollbackRef.current,
                );
                crossOffRollbackRef.current = undefined;
              }
              latestCrossOffRef.current.delete(noteId);
            });
        }, SCOUTING_PICKLIST_DELAY_MS);
        crossOffDebouncersRef.current.set(noteId, debounced);
      }

      debounced();
    },
    [queryClient, queryKey, teamId],
  );

  return {
    createNote,
    updateNote,
    deleteNote,
    reorderNotes,
    scheduleReorder,
    scheduleCrossOff,
    isReorderPending,
  };
}
