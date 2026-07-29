import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import type {
  ScoutNoteRecord,
  UpdateScoutNotePayload,
} from "@/lib/queries/scouting";

export function mergeScoutNoteInList(
  notes: ScoutNoteRecord[],
  updated: ScoutNoteRecord,
): ScoutNoteRecord[] {
  // Merge so offline-queued stubs (partial fields) don't wipe cache.
  return notes.map((note) =>
    note.id === updated.id ? { ...note, ...updated } : note,
  );
}

/** Replace a temp offline-create id with the server note after outbox flush. */
export function remapScoutNoteTempId(
  queryClient: QueryClient,
  tempNoteId: string,
  serverNote: ScoutNoteRecord,
): void {
  queryClient.setQueriesData<ScoutNoteRecord[]>(
    { queryKey: ["knowledge", "scouting"] },
    (old) => {
      if (!old) return old;
      return old.map((note) =>
        note.id === tempNoteId ? { ...note, ...serverNote } : note,
      );
    },
  );
}

export function applyScoutNotePatch(
  queryClient: QueryClient,
  teamId: string,
  updated: ScoutNoteRecord,
): void {
  queryClient.setQueryData<ScoutNoteRecord[]>(
    queryKeys.knowledge.scouting(teamId),
    (old) => (old ? mergeScoutNoteInList(old, updated) : old),
  );
}

export function optimisticallyPatchScoutNote(
  queryClient: QueryClient,
  teamId: string,
  noteId: string,
  patch: UpdateScoutNotePayload,
): void {
  queryClient.setQueryData<ScoutNoteRecord[]>(
    queryKeys.knowledge.scouting(teamId),
    (old) => {
      if (!old) return old;
      return old.map((note) => {
        if (note.id !== noteId) return note;
        const next: ScoutNoteRecord = {
          ...note,
          ...patch,
          mechanisms:
            patch.mechanisms !== undefined
              ? patch.mechanisms
              : note.mechanisms,
          formNotes:
            patch.formNotes !== undefined ? patch.formNotes : note.formNotes,
          targetTeamName:
            patch.targetTeamName !== undefined
              ? patch.targetTeamName
              : note.targetTeamName,
        };
        if (patch.doNotPick === true) {
          next.pickRank = null;
          next.doNotPick = true;
        }
        return next;
      });
    },
  );
}

/** Pure rewrite of ranked + DNP membership from ordered id lists. */
export function applyReorderToScoutNotes(
  notes: ScoutNoteRecord[],
  orderedNoteIds: string[],
  dnpNoteIds: string[] = [],
): ScoutNoteRecord[] {
  const rankedIndex = new Map(
    orderedNoteIds.map((id, index) => [id, index + 1]),
  );
  const dnpSet = new Set(dnpNoteIds);

  return notes.map((note) => {
    if (rankedIndex.has(note.id)) {
      return {
        ...note,
        pickRank: rankedIndex.get(note.id) ?? null,
        doNotPick: false,
      };
    }
    if (dnpSet.has(note.id)) {
      return { ...note, pickRank: null, doNotPick: true };
    }
    if (note.pickRank != null || note.doNotPick) {
      return { ...note, pickRank: null, doNotPick: false };
    }
    return note;
  });
}

/** Rewrite ranked + DNP membership from ordered id lists. */
export function optimisticallyReorderScoutNotes(
  queryClient: QueryClient,
  teamId: string,
  orderedNoteIds: string[],
  dnpNoteIds: string[] = [],
): void {
  queryClient.setQueryData<ScoutNoteRecord[]>(
    queryKeys.knowledge.scouting(teamId),
    (old) =>
      old ? applyReorderToScoutNotes(old, orderedNoteIds, dnpNoteIds) : old,
  );
}

export function replaceScoutNotesCache(
  queryClient: QueryClient,
  teamId: string,
  notes: ScoutNoteRecord[],
): void {
  queryClient.setQueryData(queryKeys.knowledge.scouting(teamId), notes);
}
