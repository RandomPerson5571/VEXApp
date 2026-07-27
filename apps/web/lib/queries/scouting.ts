import { throwIfRateLimited } from "@/lib/queries/api-response";
import { queryKeys } from "@/lib/query-client";

export type ScoutNoteRecord = {
  id: string;
  teamId: string;
  targetTeamNumber: string;
  targetTeamName: string | null;
  content: string;
  driveRating: number | null;
  autonReliability: number | null;
  mechanisms: string | null;
  formNotes: string | null;
  pickRank: number | null;
  doNotPick: boolean;
  crossedOff: boolean;
  createdById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: { id: string; firstName: string; lastName: string };
};

export type CreateScoutNotePayload = {
  targetTeamNumber: string;
  targetTeamName?: string | null;
  content?: string;
  driveRating?: number | null;
  autonReliability?: number | null;
  mechanisms?: string | null;
  formNotes?: string | null;
  pickRank?: number | null;
  doNotPick?: boolean;
  crossedOff?: boolean;
};

export type UpdateScoutNotePayload = {
  targetTeamNumber?: string;
  targetTeamName?: string | null;
  content?: string;
  driveRating?: number | null;
  autonReliability?: number | null;
  mechanisms?: string | null;
  formNotes?: string | null;
  pickRank?: number | null;
  doNotPick?: boolean;
  crossedOff?: boolean;
};

export type ReorderScoutNotesPayload = {
  orderedNoteIds: string[];
  dnpNoteIds?: string[];
};

async function readError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? fallback;
}

export async function fetchScoutNotes(): Promise<ScoutNoteRecord[]> {
  const response = await fetch("/api/knowledge/scouting");
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to fetch scout notes."));
  }
  return response.json() as Promise<ScoutNoteRecord[]>;
}

export async function createScoutNoteFromApi(
  payload: CreateScoutNotePayload,
): Promise<ScoutNoteRecord> {
  const response = await fetch("/api/knowledge/scouting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to create scout note."));
  }
  return response.json() as Promise<ScoutNoteRecord>;
}

export async function updateScoutNoteFromApi(
  noteId: string,
  payload: UpdateScoutNotePayload,
): Promise<ScoutNoteRecord> {
  const response = await fetch(`/api/knowledge/scouting/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to update scout note."));
  }
  return response.json() as Promise<ScoutNoteRecord>;
}

export async function deleteScoutNoteFromApi(noteId: string): Promise<void> {
  const response = await fetch(`/api/knowledge/scouting/${noteId}`, {
    method: "DELETE",
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to delete scout note."));
  }
}

export async function reorderScoutNotesFromApi(
  payload: ReorderScoutNotesPayload,
): Promise<ScoutNoteRecord[]> {
  const response = await fetch("/api/knowledge/scouting/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  throwIfRateLimited(response);
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to reorder picklist."));
  }
  return response.json() as Promise<ScoutNoteRecord[]>;
}

export function scoutNotesQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.knowledge.scouting(teamId),
    queryFn: fetchScoutNotes,
    enabled: Boolean(teamId),
  };
}
