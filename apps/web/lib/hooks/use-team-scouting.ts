"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTeam } from "@/components/providers/UserProvider";
import {
  createScoutNoteFromApi,
  deleteScoutNoteFromApi,
  scoutNotesQueryOptions,
  updateScoutNoteFromApi,
  type CreateScoutNotePayload,
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

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.knowledge.scouting(teamId),
    });
  };

  const createNote = useMutation({
    mutationFn: (payload: CreateScoutNotePayload) =>
      createScoutNoteFromApi(payload),
    onSuccess: invalidate,
  });

  const updateNote = useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: UpdateScoutNotePayload;
    }) => updateScoutNoteFromApi(noteId, payload),
    onSuccess: invalidate,
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => deleteScoutNoteFromApi(noteId),
    onSuccess: invalidate,
  });

  return { createNote, updateNote, deleteNote };
}
