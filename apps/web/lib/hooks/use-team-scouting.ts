"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
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

  return { createNote, updateNote, deleteNote, reorderNotes };
}
