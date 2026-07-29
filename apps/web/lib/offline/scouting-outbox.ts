/** IndexedDB outbox for scouting writes. Mirrored flush loop lives in public/sw.js. */

export const SCOUTING_OUTBOX_DB = "stl-vex-scouting";
export const SCOUTING_OUTBOX_STORE = "outbox";
export const SCOUTING_OUTBOX_VERSION = 1;
export const SCOUTING_SYNC_TAG = "scouting-outbox";
export const SCOUTING_OUTBOX_CHANNEL = "scouting-outbox";

export type ScoutingOutboxOp = "create" | "update" | "delete" | "reorder";

export type ScoutingOutboxRecord = {
  id: string;
  createdAt: number;
  op: ScoutingOutboxOp;
  url: string;
  method: string;
  body: string | null;
  /** Target note id for update/delete (and temp id for offline creates). */
  noteId?: string;
  tempNoteId?: string;
};

export type ScoutingOutboxFlushedMessage = {
  type: "scouting-outbox-flushed";
  tempNoteId: string;
  serverNote: unknown;
};

export type EnqueueInput = {
  op: ScoutingOutboxOp;
  url: string;
  method: string;
  body?: unknown;
  noteId?: string;
  tempNoteId?: string;
};

function parseBody(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function rewriteNoteIdsInBody(
  body: string | null,
  tempNoteId: string,
  serverId: string,
): string | null {
  if (!body) return body;
  const data = parseBody(body);
  let changed = false;

  if (Array.isArray(data.orderedNoteIds)) {
    data.orderedNoteIds = data.orderedNoteIds.map((id) => {
      if (id === tempNoteId) {
        changed = true;
        return serverId;
      }
      return id;
    });
  }
  if (Array.isArray(data.dnpNoteIds)) {
    data.dnpNoteIds = data.dnpNoteIds.map((id) => {
      if (id === tempNoteId) {
        changed = true;
        return serverId;
      }
      return id;
    });
  }

  return changed ? JSON.stringify(data) : body;
}

/** Pure coalesce — testable without IndexedDB. */
export function coalesceOutbox(
  existing: ScoutingOutboxRecord[],
  input: EnqueueInput,
): ScoutingOutboxRecord[] {
  const body =
    input.body === undefined ? null : JSON.stringify(input.body);
  const next = [...existing];

  if (input.op === "update" && input.noteId) {
    const createIdx = next.findIndex(
      (item) =>
        item.op === "create" && item.tempNoteId === input.noteId,
    );
    if (createIdx >= 0) {
      const current = next[createIdx]!;
      next[createIdx] = {
        ...current,
        body: JSON.stringify({
          ...parseBody(current.body),
          ...parseBody(body),
        }),
      };
      return next;
    }

    const updateIdx = next.findIndex(
      (item) => item.op === "update" && item.noteId === input.noteId,
    );
    if (updateIdx >= 0) {
      const current = next[updateIdx]!;
      next[updateIdx] = {
        ...current,
        body: JSON.stringify({
          ...parseBody(current.body),
          ...parseBody(body),
        }),
      };
      return next;
    }
  }

  if (input.op === "delete" && input.noteId) {
    const createIdx = next.findIndex(
      (item) =>
        item.op === "create" && item.tempNoteId === input.noteId,
    );
    if (createIdx >= 0) {
      return next.filter((_, i) => i !== createIdx);
    }
    return [
      ...next.filter(
        (item) =>
          !(item.op === "update" && item.noteId === input.noteId),
      ),
      {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        op: "delete",
        url: input.url,
        method: input.method,
        body: null,
        noteId: input.noteId,
      },
    ];
  }

  if (input.op === "reorder") {
    const withoutReorder = next.filter((item) => item.op !== "reorder");
    return [
      ...withoutReorder,
      {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        op: "reorder",
        url: input.url,
        method: input.method,
        body,
      },
    ];
  }

  next.push({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    op: input.op,
    url: input.url,
    method: input.method,
    body,
    noteId: input.noteId,
    tempNoteId: input.tempNoteId,
  });
  return next;
}

/** After a create flush, rewrite later items that still reference the temp id. */
export function remapTempNoteIdInOutbox(
  items: ScoutingOutboxRecord[],
  tempNoteId: string,
  serverId: string,
): ScoutingOutboxRecord[] {
  return items.map((item) => {
    const noteId =
      item.noteId === tempNoteId ? serverId : item.noteId;
    const url =
      item.noteId === tempNoteId
        ? item.url.replace(tempNoteId, serverId)
        : item.url;
    return {
      ...item,
      noteId,
      url,
      body: rewriteNoteIdsInBody(item.body, tempNoteId, serverId),
    };
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      SCOUTING_OUTBOX_DB,
      SCOUTING_OUTBOX_VERSION,
    );
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SCOUTING_OUTBOX_STORE)) {
        const store = db.createObjectStore(SCOUTING_OUTBOX_STORE, {
          keyPath: "id",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open outbox DB"));
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function listOutbox(): Promise<ScoutingOutboxRecord[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(SCOUTING_OUTBOX_STORE, "readonly");
    const store = tx.objectStore(SCOUTING_OUTBOX_STORE);
    const index = store.index("createdAt");
    const rows = await idbRequest(
      index.getAll() as IDBRequest<ScoutingOutboxRecord[]>,
    );
    return rows;
  } finally {
    db.close();
  }
}

async function replaceOutbox(
  items: ScoutingOutboxRecord[],
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(SCOUTING_OUTBOX_STORE, "readwrite");
    const store = tx.objectStore(SCOUTING_OUTBOX_STORE);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("Failed to write outbox"));
      tx.onabort = () =>
        reject(tx.error ?? new Error("Outbox write aborted"));
    });
  } finally {
    db.close();
  }
}

export async function removeOutboxItem(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(SCOUTING_OUTBOX_STORE, "readwrite");
    tx.objectStore(SCOUTING_OUTBOX_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("Failed to delete outbox item"));
    });
  } finally {
    db.close();
  }
}

export async function enqueueScoutingMutation(
  input: EnqueueInput,
): Promise<void> {
  const existing = await listOutbox();
  await replaceOutbox(coalesceOutbox(existing, input));
  await requestScoutingSync();
}

export function isLikelyNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError;
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export async function requestScoutingSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (
      registration as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      }
    ).sync;
    if (syncManager) {
      await syncManager.register(SCOUTING_SYNC_TAG);
    }
  } catch {
    // Background Sync unavailable (Safari/Firefox/dev without SW).
  }
}

function broadcastFlushed(
  tempNoteId: string,
  serverNote: unknown,
): void {
  const message: ScoutingOutboxFlushedMessage = {
    type: "scouting-outbox-flushed",
    tempNoteId,
    serverNote,
  };
  try {
    const channel = new BroadcastChannel(SCOUTING_OUTBOX_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // BroadcastChannel unavailable.
  }
}

export type FlushResult = {
  flushed: number;
  stoppedReason?: "network" | "server" | "empty";
};

export type FlushStepResult =
  | {
      action: "remove";
      remaining: ScoutingOutboxRecord[];
      remap?: { tempNoteId: string; serverId: string; serverNote: unknown };
    }
  | { action: "stop"; reason: "network" | "server" }
  | { action: "drop"; remaining: ScoutingOutboxRecord[] };

/** Pure one-item flush step — used by flushScoutingOutbox and unit tests. */
export async function flushOutboxHead(
  items: ScoutingOutboxRecord[],
  fetchImpl: typeof fetch,
): Promise<FlushStepResult> {
  if (items.length === 0) {
    return { action: "stop", reason: "network" };
  }

  const item = items[0]!;
  const remaining = items.slice(1);
  let response: Response;
  try {
    response = await fetchImpl(item.url, {
      method: item.method,
      headers: item.body
        ? { "Content-Type": "application/json" }
        : undefined,
      body: item.body,
      credentials: "same-origin",
    });
  } catch {
    return { action: "stop", reason: "network" };
  }

  if (response.ok) {
    if (item.op === "create" && item.tempNoteId) {
      const serverNote = (await response.json().catch(() => null)) as {
        id?: string;
      } | null;
      const serverId = serverNote?.id;
      if (serverId) {
        return {
          action: "remove",
          remaining: remapTempNoteIdInOutbox(
            remaining,
            item.tempNoteId,
            serverId,
          ),
          remap: {
            tempNoteId: item.tempNoteId,
            serverId,
            serverNote,
          },
        };
      }
    }
    return { action: "remove", remaining };
  }

  if (response.status === 429 || response.status >= 500) {
    return { action: "stop", reason: "server" };
  }

  console.error(
    "[scouting-outbox] dropping failed item",
    item.op,
    response.status,
  );
  return { action: "drop", remaining };
}

/**
 * Replay outbox FIFO. Removes on 2xx; drops on other 4xx; stops on network/5xx/429.
 */
export async function flushScoutingOutbox(
  fetchImpl: typeof fetch = fetch,
): Promise<FlushResult> {
  let flushed = 0;

  // Re-read each iteration so remaps after create stay consistent.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const items = await listOutbox();
    if (items.length === 0) {
      return { flushed, stoppedReason: flushed === 0 ? "empty" : undefined };
    }

    const step = await flushOutboxHead(items, fetchImpl);
    if (step.action === "stop") {
      return { flushed, stoppedReason: step.reason };
    }

    if (step.action === "remove" && step.remap) {
      broadcastFlushed(step.remap.tempNoteId, step.remap.serverNote);
    }

    await replaceOutbox(step.remaining);
    if (step.action === "remove") {
      flushed += 1;
    }
  }
}
