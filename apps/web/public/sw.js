const CACHE_NAME = "stl-vex-static-v1";
const STATIC_ASSETS = ["/", "/icon.png", "/logos/Robotics_lion.svg"];

// Mirrored from apps/web/lib/offline/scouting-outbox.ts — keep store/DB names in sync.
const SCOUTING_OUTBOX_DB = "stl-vex-scouting";
const SCOUTING_OUTBOX_STORE = "outbox";
const SCOUTING_OUTBOX_VERSION = 1;
const SCOUTING_SYNC_TAG = "scouting-outbox";
const SCOUTING_OUTBOX_CHANNEL = "scouting-outbox";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next/")
  ) {
    return;
  }

  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      }),
    );
  }
});

function openOutboxDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SCOUTING_OUTBOX_DB, SCOUTING_OUTBOX_VERSION);
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
      reject(request.error || new Error("Failed to open outbox DB"));
  });
}

function idbReq(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("IndexedDB request failed"));
  });
}

async function listOutbox() {
  const db = await openOutboxDb();
  try {
    const tx = db.transaction(SCOUTING_OUTBOX_STORE, "readonly");
    const store = tx.objectStore(SCOUTING_OUTBOX_STORE);
    return await idbReq(store.index("createdAt").getAll());
  } finally {
    db.close();
  }
}

async function replaceOutbox(items) {
  const db = await openOutboxDb();
  try {
    const tx = db.transaction(SCOUTING_OUTBOX_STORE, "readwrite");
    const store = tx.objectStore(SCOUTING_OUTBOX_STORE);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to write outbox"));
      tx.onabort = () => reject(tx.error || new Error("Outbox write aborted"));
    });
  } finally {
    db.close();
  }
}

function parseBody(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function rewriteNoteIdsInBody(body, tempNoteId, serverId) {
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

function remapTempNoteIdInOutbox(items, tempNoteId, serverId) {
  return items.map((item) => {
    const noteId = item.noteId === tempNoteId ? serverId : item.noteId;
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

async function notifyClients(message) {
  try {
    const channel = new BroadcastChannel(SCOUTING_OUTBOX_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // ignore
  }
  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clientsList) {
    client.postMessage(message);
  }
}

async function flushScoutingOutbox() {
  while (true) {
    const items = await listOutbox();
    if (items.length === 0) return;

    const item = items[0];
    let response;
    try {
      response = await fetch(item.url, {
        method: item.method,
        headers: item.body
          ? { "Content-Type": "application/json" }
          : undefined,
        body: item.body,
        credentials: "same-origin",
      });
    } catch {
      return;
    }

    if (response.ok) {
      const remaining = items.slice(1);
      if (item.op === "create" && item.tempNoteId) {
        const serverNote = await response.json().catch(() => null);
        const serverId = serverNote && serverNote.id;
        if (serverId) {
          await notifyClients({
            type: "scouting-outbox-flushed",
            tempNoteId: item.tempNoteId,
            serverNote,
          });
          await replaceOutbox(
            remapTempNoteIdInOutbox(remaining, item.tempNoteId, serverId),
          );
        } else {
          await replaceOutbox(remaining);
        }
      } else {
        await replaceOutbox(remaining);
      }
      continue;
    }

    if (response.status === 429 || response.status >= 500) {
      return;
    }

    console.error(
      "[scouting-outbox] dropping failed item",
      item.op,
      response.status,
    );
    await replaceOutbox(items.slice(1));
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SCOUTING_SYNC_TAG) {
    event.waitUntil(flushScoutingOutbox());
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "scouting-outbox-flush") {
    event.waitUntil(flushScoutingOutbox());
  }
});
