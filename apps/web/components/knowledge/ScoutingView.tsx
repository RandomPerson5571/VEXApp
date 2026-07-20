"use client";

import { useEffect, useMemo, useState } from "react";
import { Binoculars, Plus, Search, Trash2, X } from "lucide-react";

import { ScoutNoteEditor } from "@/components/knowledge/ScoutNoteEditor";
import { useTeam, useUser } from "@/components/providers/UserProvider";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import {
  useScoutingMutations,
  useTeamScouting,
} from "@/lib/hooks/use-team-scouting";

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

export function ScoutingView() {
  const user = useUser();
  const team = useTeam();
  const isAdmin = isGlobalAdmin(user);
  const { teamId, notes, isLoading, isError } = useTeamScouting();
  const { createNote, updateNote, deleteNote } = useScoutingMutations(teamId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftHtml, setDraftHtml] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        note.targetTeamNumber.toLowerCase().includes(q) ||
        (note.targetTeamName?.toLowerCase().includes(q) ?? false),
    );
  }, [notes, search]);

  const selected = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  useEffect(() => {
    if (!selectedId && notes[0]) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  useEffect(() => {
    setDraftHtml(selected?.content ?? "");
  }, [selected?.id, selected?.content]);

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
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create note.",
      );
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setFormError(null);
    try {
      await updateNote.mutateAsync({
        noteId: selected.id,
        payload: { content: draftHtml },
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save note.",
      );
    }
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
            const active = note.id === selectedId;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedId(note.id)}
                className={`mb-1 w-full rounded-lg border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-orange-500/30 bg-orange-500/10"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-[#121212]"
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {note.targetTeamNumber}
                </div>
                {note.targetTeamName && (
                  <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {note.targetTeamName}
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

        {!selected ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a team to open its notepad.
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
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={updateNote.isPending}
                    className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
                  >
                    {updateNote.isPending ? "Saving…" : "Save"}
                  </button>
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

            <ScoutNoteEditor
              key={selected.id}
              content={selected.content}
              editable={isAdmin}
              onChange={setDraftHtml}
            />
          </>
        )}
      </section>
    </div>
  );
}
