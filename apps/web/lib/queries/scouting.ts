import { throwIfRateLimited } from "@/lib/queries/api-response";
import { queryKeys } from "@/lib/query-client";
import {
  enqueueScoutingMutation,
  isBrowserOffline,
  isLikelyNetworkFailure,
} from "@/lib/offline/scouting-outbox";

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

function syntheticCreateNote(
  tempNoteId: string,
  payload: CreateScoutNotePayload,
): ScoutNoteRecord {
  const now = new Date().toISOString();
  return {
    id: tempNoteId,
    teamId: "",
    targetTeamNumber: payload.targetTeamNumber,
    targetTeamName: payload.targetTeamName ?? null,
    content: payload.content ?? "",
    driveRating: payload.driveRating ?? null,
    autonReliability: payload.autonReliability ?? null,
    mechanisms: payload.mechanisms ?? null,
    formNotes: payload.formNotes ?? null,
    pickRank: payload.pickRank ?? null,
    doNotPick: payload.doNotPick ?? false,
    crossedOff: payload.crossedOff ?? false,
    createdById: "",
    createdAt: now,
    updatedAt: now,
    createdBy: { id: "", firstName: "", lastName: "" },
  };
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
  const queueCreate = async () => {
    const tempNoteId = crypto.randomUUID();
    await enqueueScoutingMutation({
      op: "create",
      url: "/api/knowledge/scouting",
      method: "POST",
      body: payload,
      tempNoteId,
      noteId: tempNoteId,
    });
    return syntheticCreateNote(tempNoteId, payload);
  };

  if (isBrowserOffline()) {
    return queueCreate();
  }

  try {
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
  } catch (error) {
    if (isLikelyNetworkFailure(error)) {
      return queueCreate();
    }
    throw error;
  }
}

export async function updateScoutNoteFromApi(
  noteId: string,
  payload: UpdateScoutNotePayload,
): Promise<ScoutNoteRecord> {
  const queueUpdate = async () => {
    await enqueueScoutingMutation({
      op: "update",
      url: `/api/knowledge/scouting/${noteId}`,
      method: "PATCH",
      body: payload,
      noteId,
    });
    // Partial stub; applyScoutNotePatch merges into existing cache entry.
    return { id: noteId, ...payload } as ScoutNoteRecord;
  };

  if (isBrowserOffline()) {
    return queueUpdate();
  }

  try {
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
  } catch (error) {
    if (isLikelyNetworkFailure(error)) {
      return queueUpdate();
    }
    throw error;
  }
}

export async function deleteScoutNoteFromApi(noteId: string): Promise<void> {
  const queueDelete = async () => {
    await enqueueScoutingMutation({
      op: "delete",
      url: `/api/knowledge/scouting/${noteId}`,
      method: "DELETE",
      noteId,
    });
  };

  if (isBrowserOffline()) {
    await queueDelete();
    return;
  }

  try {
    const response = await fetch(`/api/knowledge/scouting/${noteId}`, {
      method: "DELETE",
    });
    throwIfRateLimited(response);
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to delete scout note."));
    }
  } catch (error) {
    if (isLikelyNetworkFailure(error)) {
      await queueDelete();
      return;
    }
    throw error;
  }
}

export async function reorderScoutNotesFromApi(
  payload: ReorderScoutNotesPayload,
): Promise<ScoutNoteRecord[]> {
  const queueReorder = async () => {
    await enqueueScoutingMutation({
      op: "reorder",
      url: "/api/knowledge/scouting/reorder",
      method: "POST",
      body: payload,
    });
    // Callers already applied optimistic reorder; empty list is unused on success paths that replace cache only when server returns notes.
    return [];
  };

  if (isBrowserOffline()) {
    return queueReorder();
  }

  try {
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
  } catch (error) {
    if (isLikelyNetworkFailure(error)) {
      return queueReorder();
    }
    throw error;
  }
}

export function scoutNotesQueryOptions(teamId: string) {
  return {
    queryKey: queryKeys.knowledge.scouting(teamId),
    queryFn: fetchScoutNotes,
    enabled: Boolean(teamId),
  };
}
