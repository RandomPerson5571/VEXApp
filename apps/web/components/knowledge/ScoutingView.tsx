"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Ban,
  Binoculars,
  ListOrdered,
  ListPlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { PicklistBoard } from "@/components/knowledge/PicklistBoard";
import { ScoutNoteEditor } from "@/components/knowledge/ScoutNoteEditor";
import { useTeam, useUser } from "@/components/providers/UserProvider";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import { SCOUTING_AUTOSAVE_DELAY_MS } from "@/lib/constants/request-timing";
import { useDebouncedSaver } from "@/lib/hooks/use-debounced-saver";
import {
  useScoutingMutations,
  useTeamScouting,
} from "@/lib/hooks/use-team-scouting";
import type {
  ScoutNoteRecord,
  UpdateScoutNotePayload,
} from "@/lib/queries/scouting";

type ScoutViewMode = "form" | "picklist";

type ScoutFormDraft = {
  driveRating: number | null;
  autonReliability: number | null;
  mechanisms: string;
  pickRank: number | null;
  doNotPick: boolean;
  crossedOff: boolean;
};

function draftFromNote(note: ScoutNoteRecord): ScoutFormDraft {
  return {
    driveRating: note.driveRating,
    autonReliability: note.autonReliability,
    mechanisms: note.mechanisms ?? "",
    pickRank: note.pickRank,
    doNotPick: note.doNotPick,
    crossedOff: note.crossedOff,
  };
}

function picklistIdsFromNotes(notes: ScoutNoteRecord[]) {
  const orderedNoteIds = notes
    .filter((note) => note.pickRank != null && !note.doNotPick)
    .sort((a, b) => (a.pickRank ?? 0) - (b.pickRank ?? 0))
    .map((note) => note.id);
  const dnpNoteIds = notes
    .filter((note) => note.doNotPick)
    .map((note) => note.id);
  return { orderedNoteIds, dnpNoteIds };
}

function ScoutingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-8 dark:bg-[#000000]">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-8 text-center dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-slate-100 dark:border-[#1a1a1a] dark:bg-[#121212]">
          <Binoculars className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
          No team assigned
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Join a team to view scouting notes.
        </p>
      </div>
    </div>
  );
}

function RatingSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : Number(next));
        }}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500/50 disabled:opacity-60 dark:border-[#1a1a1a] dark:bg-[#121212] dark:text-slate-100"
      >
        <option value="">—</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

function fieldClassName(editable: boolean) {
  return `w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500/50 dark:border-[#1a1a1a] dark:bg-[#121212] dark:text-slate-100 ${
    editable ? "" : "opacity-60"
  }`;
}

export function ScoutingView() {
  const user = useUser();
  const team = useTeam();
  const isAdmin = isGlobalAdmin(user);
  const { teamId, notes, isLoading, isError } = useTeamScouting();
  const {
    createNote,
    updateNote,
    deleteNote,
    scheduleReorder,
    scheduleCrossOff,
    isReorderPending,
  } = useScoutingMutations(teamId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveNoteId, setSaveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [viewMode, setViewMode] = useState<ScoutViewMode>("form");
  const [draftNoteId, setDraftNoteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScoutFormDraft | null>(null);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        note.targetTeamNumber.toLowerCase().includes(q) ||
        (note.targetTeamName?.toLowerCase().includes(q) ?? false) ||
        (note.mechanisms?.toLowerCase().includes(q) ?? false),
    );
  }, [notes, search]);

  const activeId =
    selectedId && notes.some((note) => note.id === selectedId)
      ? selectedId
      : (notes[0]?.id ?? null);

  const selected = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [notes, activeId],
  );

  // ponytail: reset save status + form draft when switching notes
  if (saveNoteId !== (selected?.id ?? null)) {
    setSaveNoteId(selected?.id ?? null);
    setSaveState("idle");
  }
  if (draftNoteId !== (selected?.id ?? null)) {
    setDraftNoteId(selected?.id ?? null);
    setDraft(selected ? draftFromNote(selected) : null);
  }

  const scheduleSave = useDebouncedSaver<UpdateScoutNotePayload>(
    SCOUTING_AUTOSAVE_DELAY_MS,
    useCallback(
      async (noteId, payload) => {
        setSaveState("saving");
        setFormError(null);
        try {
          await updateNote.mutateAsync({ noteId, payload });
          setSaveState("saved");
        } catch (error) {
          setSaveState("error");
          setFormError(
            error instanceof Error ? error.message : "Failed to save note.",
          );
        }
      },
      [updateNote],
    ),
  );

  if (!team) {
    return <ScoutingFallback />;
  }

  const handleCreate = async () => {
    setFormError(null);
    try {
      const note = await createNote.mutateAsync({
        targetTeamNumber: newNumber,
        targetTeamName: newName || null,
      });
      setNewNumber("");
      setNewName("");
      setAdding(false);
      setSelectedId(note.id);
      setViewMode("form");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create note.",
      );
    }
  };

  const patchSelected = (payload: UpdateScoutNotePayload) => {
    if (!selected || !isAdmin || !draft) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...(payload.driveRating !== undefined
          ? { driveRating: payload.driveRating }
          : {}),
        ...(payload.autonReliability !== undefined
          ? { autonReliability: payload.autonReliability }
          : {}),
        ...(payload.mechanisms !== undefined
          ? { mechanisms: payload.mechanisms ?? "" }
          : {}),
        ...(payload.pickRank !== undefined
          ? { pickRank: payload.pickRank }
          : {}),
        ...(payload.doNotPick !== undefined
          ? { doNotPick: payload.doNotPick }
          : {}),
        ...(payload.crossedOff !== undefined
          ? { crossedOff: payload.crossedOff }
          : {}),
      };
    });
    setSaveState("idle");
    scheduleSave(selected.id, payload);
  };

  const handleEditorChange = (html: string) => {
    if (!selected || !isAdmin) return;
    setSaveState("idle");
    scheduleSave(selected.id, { content: html });
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormError(null);
    try {
      await deleteNote.mutateAsync(selected.id);
      setSelectedId(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete note.",
      );
    }
  };

  const handleReorder = (orderedNoteIds: string[], dnpNoteIds: string[]) => {
    if (!isAdmin) return;
    setFormError(null);
    scheduleReorder({ orderedNoteIds, dnpNoteIds });
  };

  const handleToggleCrossOff = (noteId: string, crossedOff: boolean) => {
    if (!isAdmin) return;
    setFormError(null);
    scheduleCrossOff(noteId, crossedOff);
  };

  const applyPicklistMembership = (
    noteId: string,
    membership: "ranked" | "dnp" | "none",
  ) => {
    if (!isAdmin) return;
    setFormError(null);
    const { orderedNoteIds, dnpNoteIds } = picklistIdsFromNotes(notes);
    if (membership === "ranked" && orderedNoteIds.includes(noteId)) return;
    if (membership === "dnp" && dnpNoteIds.includes(noteId)) return;
    if (
      membership === "none" &&
      !orderedNoteIds.includes(noteId) &&
      !dnpNoteIds.includes(noteId)
    ) {
      return;
    }

    let nextRanked = orderedNoteIds.filter((id) => id !== noteId);
    let nextDnp = dnpNoteIds.filter((id) => id !== noteId);
    if (membership === "ranked") {
      nextRanked = [...nextRanked, noteId];
    } else if (membership === "dnp") {
      nextDnp = [...nextDnp, noteId];
    }

    scheduleReorder({
      orderedNoteIds: nextRanked,
      dnpNoteIds: nextDnp,
    });
    setDraft((prev) => {
      if (!prev) return prev;
      if (membership === "ranked") {
        return {
          ...prev,
          doNotPick: false,
          pickRank: nextRanked.indexOf(noteId) + 1,
        };
      }
      if (membership === "dnp") {
        return { ...prev, doNotPick: true, pickRank: null };
      }
      return { ...prev, doNotPick: false, pickRank: null };
    });
  };

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "Autosave on";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-slate-100 p-4 dark:bg-[#000000] md:flex-row md:p-6">
      <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a] md:w-72">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-[#1a1a1a]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100">
              Scouted teams
            </h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdding((open) => !open)}
                aria-label={adding ? "Cancel add team" : "Add team note"}
                title={adding ? "Cancel" : "Add team"}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                  adding
                    ? "border-slate-300 text-slate-600 dark:border-[#2a2a2a] dark:text-slate-300"
                    : "border-orange-500/30 bg-orange-500/15 text-orange-500 hover:bg-orange-500/25"
                }`}
              >
                {adding ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-[#1a1a1a]">
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                viewMode === "form"
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Scout form
            </button>
            <button
              type="button"
              onClick={() => setViewMode("picklist")}
              className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                viewMode === "picklist"
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <ListOrdered className="h-3 w-3" />
              Picklist
            </button>
          </div>

          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-orange-500/50 dark:border-[#1a1a1a] dark:bg-[#121212] dark:text-slate-100"
            />
          </div>
        </div>

        {isAdmin && adding && (
          <div className="space-y-2 border-b border-slate-200 p-3 dark:border-[#1a1a1a]">
            <input
              value={newNumber}
              onChange={(event) => setNewNumber(event.target.value)}
              placeholder="Team number (e.g. 12345A)"
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500/50 dark:border-[#1a1a1a] dark:bg-[#121212] dark:text-slate-100"
            />
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Team name (optional)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-orange-500/50 dark:border-[#1a1a1a] dark:bg-[#121212] dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!newNumber.trim() || createNote.isPending}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              Create notepad
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 dashboard-scroll">
          {isLoading && (
            <p className="px-2 py-3 text-xs text-slate-500">Loading…</p>
          )}
          {isError && (
            <p className="px-2 py-3 text-xs text-red-500">
              Failed to load scout notes.
            </p>
          )}
          {!isLoading && notes.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? "Tap + to add a team notepad."
                : "No scouting notes yet."}
            </p>
          )}
          {!isLoading && notes.length > 0 && filteredNotes.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
              No teams match “{search.trim()}”.
            </p>
          )}
          {filteredNotes.map((note) => {
            const active = note.id === activeId;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  setSelectedId(note.id);
                  setViewMode("form");
                }}
                className={`mb-1 w-full rounded-lg border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-orange-500/30 bg-orange-500/10"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-[#121212]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {note.targetTeamNumber}
                  </div>
                  {note.doNotPick ? (
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                      DNP
                    </span>
                  ) : note.pickRank != null ? (
                    <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      #{note.pickRank}
                    </span>
                  ) : null}
                </div>
                {note.targetTeamName && (
                  <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {note.targetTeamName}
                  </div>
                )}
                {(note.driveRating != null || note.autonReliability != null) && (
                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {note.driveRating != null ? `D${note.driveRating}` : "D—"}
                    {" · "}
                    {note.autonReliability != null
                      ? `A${note.autonReliability}`
                      : "A—"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        {formError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {formError}
          </p>
        )}

        {viewMode === "picklist" ? (
          <PicklistBoard
            notes={notes}
            canEdit={isAdmin}
            onReorder={handleReorder}
            onToggleCrossOff={handleToggleCrossOff}
            onOpenNote={(noteId) => {
              setSelectedId(noteId);
              setViewMode("form");
            }}
          />
        ) : !selected ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a team to open its scout form.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selected.targetTeamNumber}
                </h1>
                {selected.targetTeamName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selected.targetTeamName}
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold ${
                      saveState === "error"
                        ? "text-red-500"
                        : saveState === "saved"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {saveLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleteNote.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-500/40 hover:text-red-500 dark:border-[#1a1a1a] dark:text-slate-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {draft && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
                <div className="flex flex-wrap gap-3">
                  <RatingSelect
                    label="Drive"
                    value={draft.driveRating}
                    disabled={!isAdmin}
                    onChange={(driveRating) => patchSelected({ driveRating })}
                  />
                  <RatingSelect
                    label="Auton reliability"
                    value={draft.autonReliability}
                    disabled={!isAdmin}
                    onChange={(autonReliability) =>
                      patchSelected({ autonReliability })
                    }
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-[#1a1a1a] dark:bg-[#121212]/80">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Picklist
                      </span>
                      {draft.doNotPick ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                          <Ban className="h-3 w-3" />
                          Do not pick
                        </span>
                      ) : draft.pickRank != null ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                          <ListOrdered className="h-3 w-3" />
                          Rank #{draft.pickRank}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          Not on list
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        {!(draft.pickRank != null && !draft.doNotPick) && (
                          <button
                            type="button"
                            disabled={isReorderPending}
                            onClick={() =>
                              applyPicklistMembership(selected.id, "ranked")
                            }
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-orange-600 transition hover:bg-orange-500/10 disabled:opacity-50 dark:text-orange-400"
                          >
                            <ListPlus className="h-3.5 w-3.5" />
                            Rank
                          </button>
                        )}
                        {!draft.doNotPick && (
                          <button
                            type="button"
                            disabled={isReorderPending}
                            onClick={() =>
                              applyPicklistMembership(selected.id, "dnp")
                            }
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200/70 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#1a1a1a]"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            DNP
                          </button>
                        )}
                        {(draft.pickRank != null || draft.doNotPick) && (
                          <button
                            type="button"
                            disabled={isReorderPending}
                            onClick={() =>
                              applyPicklistMembership(selected.id, "none")
                            }
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-200/70 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-[#1a1a1a]"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Mechanisms
                  </span>
                  <input
                    value={draft.mechanisms}
                    disabled={!isAdmin}
                    placeholder="Intake, elevating, hang…"
                    onChange={(event) =>
                      patchSelected({ mechanisms: event.target.value })
                    }
                    className={fieldClassName(isAdmin)}
                  />
                </label>

              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Notes
              </h2>
              <ScoutNoteEditor
                key={selected.id}
                content={selected.content}
                editable={isAdmin}
                onChange={handleEditorChange}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
