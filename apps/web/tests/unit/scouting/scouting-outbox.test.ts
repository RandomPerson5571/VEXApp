import { describe, expect, it, vi } from "vitest";

import {
  coalesceOutbox,
  flushOutboxHead,
  remapTempNoteIdInOutbox,
  type ScoutingOutboxRecord,
} from "@/lib/offline/scouting-outbox";

function record(
  partial: Partial<ScoutingOutboxRecord> &
    Pick<ScoutingOutboxRecord, "op" | "url" | "method">,
): ScoutingOutboxRecord {
  return {
    id: partial.id ?? crypto.randomUUID(),
    createdAt: partial.createdAt ?? Date.now(),
    body: partial.body ?? null,
    noteId: partial.noteId,
    tempNoteId: partial.tempNoteId,
    ...partial,
  };
}

describe("coalesceOutbox", () => {
  it("merges two PATCHes for the same noteId into one body", () => {
    const first = coalesceOutbox([], {
      op: "update",
      url: "/api/knowledge/scouting/n1",
      method: "PATCH",
      body: { content: "a", driveRating: 3 },
      noteId: "n1",
    });
    const next = coalesceOutbox(first, {
      op: "update",
      url: "/api/knowledge/scouting/n1",
      method: "PATCH",
      body: { content: "b", mechanisms: "lift" },
      noteId: "n1",
    });

    expect(next).toHaveLength(1);
    expect(JSON.parse(next[0]!.body!)).toEqual({
      content: "b",
      driveRating: 3,
      mechanisms: "lift",
    });
  });

  it("merges PATCH into a pending create with matching tempNoteId", () => {
    const withCreate = coalesceOutbox([], {
      op: "create",
      url: "/api/knowledge/scouting",
      method: "POST",
      body: { targetTeamNumber: "123" },
      tempNoteId: "temp-1",
      noteId: "temp-1",
    });
    const next = coalesceOutbox(withCreate, {
      op: "update",
      url: "/api/knowledge/scouting/temp-1",
      method: "PATCH",
      body: { content: "<p>hi</p>" },
      noteId: "temp-1",
    });

    expect(next).toHaveLength(1);
    expect(next[0]!.op).toBe("create");
    expect(JSON.parse(next[0]!.body!)).toEqual({
      targetTeamNumber: "123",
      content: "<p>hi</p>",
    });
  });

  it("DELETE cancels a pending create instead of enqueueing", () => {
    const withCreate = coalesceOutbox([], {
      op: "create",
      url: "/api/knowledge/scouting",
      method: "POST",
      body: { targetTeamNumber: "9" },
      tempNoteId: "temp-2",
      noteId: "temp-2",
    });
    const next = coalesceOutbox(withCreate, {
      op: "delete",
      url: "/api/knowledge/scouting/temp-2",
      method: "DELETE",
      noteId: "temp-2",
    });

    expect(next).toHaveLength(0);
  });

  it("replaces a prior reorder with the latest payload", () => {
    const first = coalesceOutbox([], {
      op: "reorder",
      url: "/api/knowledge/scouting/reorder",
      method: "POST",
      body: { orderedNoteIds: ["a"] },
    });
    const next = coalesceOutbox(first, {
      op: "reorder",
      url: "/api/knowledge/scouting/reorder",
      method: "POST",
      body: { orderedNoteIds: ["b", "a"], dnpNoteIds: ["c"] },
    });

    expect(next).toHaveLength(1);
    expect(JSON.parse(next[0]!.body!)).toEqual({
      orderedNoteIds: ["b", "a"],
      dnpNoteIds: ["c"],
    });
  });
});

describe("remapTempNoteIdInOutbox", () => {
  it("rewrites update urls and reorder id lists after create flush", () => {
    const items: ScoutingOutboxRecord[] = [
      record({
        op: "update",
        url: "/api/knowledge/scouting/temp-x",
        method: "PATCH",
        noteId: "temp-x",
        body: JSON.stringify({ content: "z" }),
      }),
      record({
        op: "reorder",
        url: "/api/knowledge/scouting/reorder",
        method: "POST",
        body: JSON.stringify({
          orderedNoteIds: ["temp-x", "other"],
          dnpNoteIds: ["temp-x"],
        }),
      }),
    ];

    const remapped = remapTempNoteIdInOutbox(items, "temp-x", "server-1");
    expect(remapped[0]).toMatchObject({
      noteId: "server-1",
      url: "/api/knowledge/scouting/server-1",
    });
    expect(JSON.parse(remapped[1]!.body!)).toEqual({
      orderedNoteIds: ["server-1", "other"],
      dnpNoteIds: ["server-1"],
    });
  });
});

describe("flushOutboxHead", () => {
  it("removes the head item on 2xx", async () => {
    const items = [
      record({
        op: "update",
        url: "/api/knowledge/scouting/n1",
        method: "PATCH",
        noteId: "n1",
        body: JSON.stringify({ content: "ok" }),
      }),
      record({
        op: "delete",
        url: "/api/knowledge/scouting/n2",
        method: "DELETE",
        noteId: "n2",
      }),
    ];

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "n1" }), { status: 200 }),
    );

    const step = await flushOutboxHead(items, fetchImpl);
    expect(step).toEqual({
      action: "remove",
      remaining: [items[1]],
    });
  });

  it("stops on network failure without removing the item", async () => {
    const items = [
      record({
        op: "create",
        url: "/api/knowledge/scouting",
        method: "POST",
        body: JSON.stringify({ targetTeamNumber: "1" }),
        tempNoteId: "t1",
      }),
    ];

    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const step = await flushOutboxHead(items, fetchImpl);
    expect(step).toEqual({ action: "stop", reason: "network" });
  });

  it("remaps remaining items when create succeeds", async () => {
    const items = [
      record({
        op: "create",
        url: "/api/knowledge/scouting",
        method: "POST",
        body: JSON.stringify({ targetTeamNumber: "1" }),
        tempNoteId: "temp-9",
        noteId: "temp-9",
      }),
      record({
        op: "update",
        url: "/api/knowledge/scouting/temp-9",
        method: "PATCH",
        noteId: "temp-9",
        body: JSON.stringify({ content: "later" }),
      }),
    ];

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "srv-9", targetTeamNumber: "1" }), {
        status: 201,
      }),
    );

    const step = await flushOutboxHead(items, fetchImpl);
    expect(step.action).toBe("remove");
    if (step.action !== "remove") return;
    expect(step.remap?.serverId).toBe("srv-9");
    expect(step.remaining[0]).toMatchObject({
      noteId: "srv-9",
      url: "/api/knowledge/scouting/srv-9",
    });
  });
});
