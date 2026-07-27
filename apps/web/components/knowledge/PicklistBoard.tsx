"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeftRight, Ban, GripVertical, Strikethrough } from "lucide-react";

import { PicklistCompare } from "@/components/knowledge/PicklistCompare";
import { usePicklistRobotEvents } from "@/lib/hooks/use-picklist-robotevents";
import type { ScoutNoteRecord } from "@/lib/queries/scouting";
import { preferWinnerInPicklist } from "@/lib/scouting/prefer-winner";

type ContainerId = "ranked" | "dnp";
const PICKLIST_EVENT_STORAGE_KEY = "picklist-re-eventId";
const PICKLIST_EVENT_CHANGE = "picklist-re-event-change";

function subscribeToPicklistEvent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PICKLIST_EVENT_CHANGE, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PICKLIST_EVENT_CHANGE, onStoreChange);
  };
}

function getSelectedPicklistEvent() {
  return window.localStorage.getItem(PICKLIST_EVENT_STORAGE_KEY) ?? "";
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type PicklistBoardProps = {
  notes: ScoutNoteRecord[];
  canEdit: boolean;
  onReorder: (orderedNoteIds: string[], dnpNoteIds: string[]) => void;
  onToggleCrossOff: (noteId: string, crossedOff: boolean) => void;
  onOpenNote: (noteId: string) => void;
};

function splitLists(notes: ScoutNoteRecord[]) {
  const ranked = notes
    .filter((note) => note.pickRank != null && !note.doNotPick)
    .sort((a, b) => (a.pickRank ?? 0) - (b.pickRank ?? 0));
  const dnp = notes.filter((note) => note.doNotPick);
  return { ranked, dnp };
}

function PickCardBody({
  note,
  rankLabel,
  crossedOff,
}: {
  note: ScoutNoteRecord;
  rankLabel: string | null;
  crossedOff: boolean;
}) {
  const preview = stripHtml(note.content);
  return (
    <div className={`min-w-0 flex-1 ${crossedOff ? "opacity-50" : ""}`}>
      <div
        className={`text-sm font-bold text-slate-900 dark:text-slate-100 ${
          crossedOff ? "line-through" : ""
        }`}
      >
        {note.targetTeamNumber}
        {note.targetTeamName ? (
          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            {note.targetTeamName}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        {rankLabel ? <span>#{rankLabel}</span> : null}
        <span>Drive {note.driveRating ?? "—"}</span>
        <span>Auton {note.autonReliability ?? "—"}</span>
        {note.mechanisms ? (
          <span className="truncate">{note.mechanisms}</span>
        ) : null}
      </div>
      {preview ? (
        <p className="mt-1 line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300">
          {preview}
        </p>
      ) : null}
    </div>
  );
}

function SortablePickCard({
  note,
  rankLabel,
  canEdit,
  compareSelecting,
  compareSelected,
  onOpen,
  onToggleCrossOff,
}: {
  note: ScoutNoteRecord;
  rankLabel: string | null;
  canEdit: boolean;
  compareSelecting: boolean;
  compareSelected: boolean;
  onOpen: () => void;
  onToggleCrossOff: () => void;
}) {
  const dragEnabled = canEdit && !compareSelecting;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white dark:bg-[#0a0a0a] ${
        compareSelected
          ? "border-orange-500 ring-1 ring-orange-500/40"
          : "border-slate-200 dark:border-[#1a1a1a]"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex w-full items-start gap-2 px-2 py-2.5">
        {dragEnabled ? (
          <button
            type="button"
            aria-label="Drag to reorder"
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 touch-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#121212] dark:hover:text-slate-200"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}

        {rankLabel ? (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-xs font-black text-orange-600 dark:text-orange-400">
            {rankLabel}
          </span>
        ) : (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <Ban className="h-3.5 w-3.5" />
          </span>
        )}

        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <PickCardBody
            note={note}
            rankLabel={null}
            crossedOff={note.crossedOff}
          />
        </button>

        {canEdit && !compareSelecting ? (
          <button
            type="button"
            aria-label={note.crossedOff ? "Uncross team" : "Cross off team"}
            title={note.crossedOff ? "Uncross" : "Cross off"}
            onClick={onToggleCrossOff}
            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
              note.crossedOff
                ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:text-orange-400"
                : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-[#1a1a1a] dark:hover:text-slate-200"
            }`}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function DropColumn({
  id,
  title,
  hint,
  emptyText,
  items,
  noteById,
  canEdit,
  showRank,
  compareSelecting,
  compareSelectedIds,
  onOpenNote,
  onToggleCrossOff,
}: {
  id: ContainerId;
  title: string;
  hint: string;
  emptyText: string;
  items: string[];
  noteById: Map<string, ScoutNoteRecord>;
  canEdit: boolean;
  showRank: boolean;
  compareSelecting: boolean;
  compareSelectedIds: string[];
  onOpenNote: (noteId: string) => void;
  onToggleCrossOff: (noteId: string, crossedOff: boolean) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border ${
        isOver && !compareSelecting
          ? "border-orange-500/50 bg-orange-500/5"
          : "border-slate-200 bg-white dark:border-[#1a1a1a] dark:bg-[#0a0a0a]"
      }`}
    >
      <div className="border-b border-slate-200 px-4 py-3 dark:border-[#1a1a1a]">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 dashboard-scroll">
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <p className="px-1 py-4 text-sm text-slate-500 dark:text-slate-400">
              {emptyText}
            </p>
          ) : (
            <ol className="space-y-2">
              {items.map((noteId, index) => {
                const note = noteById.get(noteId);
                if (!note) return null;
                return (
                  <SortablePickCard
                    key={noteId}
                    note={note}
                    rankLabel={showRank ? String(index + 1) : null}
                    canEdit={canEdit}
                    compareSelecting={compareSelecting}
                    compareSelected={compareSelectedIds.includes(noteId)}
                    onOpen={() => onOpenNote(noteId)}
                    onToggleCrossOff={() =>
                      onToggleCrossOff(noteId, !note.crossedOff)
                    }
                  />
                );
              })}
            </ol>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function findContainer(
  id: UniqueIdentifier,
  ranked: string[],
  dnp: string[],
): ContainerId | null {
  if (id === "ranked" || id === "dnp") return id;
  if (ranked.includes(String(id))) return "ranked";
  if (dnp.includes(String(id))) return "dnp";
  return null;
}

export function PicklistBoard({
  notes,
  canEdit,
  onReorder,
  onToggleCrossOff,
  onOpenNote,
}: PicklistBoardProps) {
  const derived = useMemo(() => splitLists(notes), [notes]);
  const [rankedIds, setRankedIds] = useState<string[]>(() =>
    derived.ranked.map((n) => n.id),
  );
  const [dnpIds, setDnpIds] = useState<string[]>(() =>
    derived.dnp.map((n) => n.id),
  );
  const rankedRef = useRef(rankedIds);
  const dnpRef = useRef(dnpIds);

  useEffect(() => {
    rankedRef.current = rankedIds;
    dnpRef.current = dnpIds;
  }, [rankedIds, dnpIds]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareSelecting, setCompareSelecting] = useState(false);
  const [comparePair, setComparePair] = useState<string[]>([]);
  const storedEventId = useSyncExternalStore(
    subscribeToPicklistEvent,
    getSelectedPicklistEvent,
    () => "",
  );
  const { eventsQuery, analyticsQuery } =
    usePicklistRobotEvents(storedEventId);
  const selectedEventId = eventsQuery.data?.events.some(
    (event) => String(event.id) === storedEventId,
  )
    ? storedEventId
    : "";

  // Keep local drag lists in sync when server/cache notes change (ponytail: render-time sync)
  const rankedKey = derived.ranked.map((n) => n.id).join(",");
  const dnpKey = derived.dnp.map((n) => n.id).join(",");
  const [syncKey, setSyncKey] = useState(`${rankedKey}|${dnpKey}`);
  const nextSyncKey = `${rankedKey}|${dnpKey}`;
  if (nextSyncKey !== syncKey && activeId == null) {
    setSyncKey(nextSyncKey);
    const nextRanked = derived.ranked.map((n) => n.id);
    const nextDnp = derived.dnp.map((n) => n.id);
    setRankedIds(nextRanked);
    setDnpIds(nextDnp);
  }

  const noteById = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const activeNote = activeId ? noteById.get(activeId) : null;

  const setLists = (nextRanked: string[], nextDnp: string[]) => {
    rankedRef.current = nextRanked;
    dnpRef.current = nextDnp;
    setRankedIds(nextRanked);
    setDnpIds(nextDnp);
  };

  const commit = (nextRanked: string[], nextDnp: string[]) => {
    setLists(nextRanked, nextDnp);
    onReorder(nextRanked, nextDnp);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const ranked = rankedRef.current;
    const dnp = dnpRef.current;
    const activeContainer = findContainer(active.id, ranked, dnp);
    const overContainer = findContainer(over.id, ranked, dnp);
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    if (activeContainer === "ranked") {
      if (!ranked.includes(activeItemId)) return;
      const nextRanked = ranked.filter((id) => id !== activeItemId);
      const overIndex =
        overItemId === "dnp" ? dnp.length : dnp.indexOf(overItemId);
      const nextDnp = [...dnp];
      nextDnp.splice(overIndex < 0 ? nextDnp.length : overIndex, 0, activeItemId);
      setLists(nextRanked, nextDnp);
      return;
    }

    if (!dnp.includes(activeItemId)) return;
    const nextDnp = dnp.filter((id) => id !== activeItemId);
    const overIndex =
      overItemId === "ranked" ? ranked.length : ranked.indexOf(overItemId);
    const nextRanked = [...ranked];
    nextRanked.splice(
      overIndex < 0 ? nextRanked.length : overIndex,
      0,
      activeItemId,
    );
    setLists(nextRanked, nextDnp);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    const ranked = rankedRef.current;
    const dnp = dnpRef.current;

    if (!over) {
      commit(ranked, dnp);
      return;
    }

    const activeContainer = findContainer(active.id, ranked, dnp);
    const overContainer = findContainer(over.id, ranked, dnp);
    if (!activeContainer || !overContainer) {
      commit(ranked, dnp);
      return;
    }

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    if (activeContainer === overContainer) {
      const list = activeContainer === "ranked" ? ranked : dnp;
      const oldIndex = list.indexOf(activeItemId);
      const newIndex =
        overItemId === activeContainer
          ? list.length - 1
          : list.indexOf(overItemId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        commit(ranked, dnp);
        return;
      }
      const moved = arrayMove(list, oldIndex, newIndex);
      if (activeContainer === "ranked") {
        commit(moved, dnp);
      } else {
        commit(ranked, moved);
      }
      return;
    }

    // Cross-container move already applied in onDragOver
    commit(ranked, dnp);
  };

  const exitCompare = () => {
    setCompareSelecting(false);
    setComparePair([]);
  };

  const handleCardClick = (noteId: string) => {
    if (!compareSelecting) {
      onOpenNote(noteId);
      return;
    }
    setComparePair((prev) => {
      if (prev.includes(noteId)) return prev.filter((id) => id !== noteId);
      if (prev.length >= 2) return prev;
      return [...prev, noteId];
    });
  };

  const handlePrefer = (winnerId: string, loserId: string) => {
    const next = preferWinnerInPicklist(
      rankedRef.current,
      dnpRef.current,
      winnerId,
      loserId,
    );
    commit(next.orderedNoteIds, next.dnpNoteIds);
    exitCompare();
  };

  const leftCompare = comparePair[0] ? noteById.get(comparePair[0]) : null;
  const rightCompare = comparePair[1] ? noteById.get(comparePair[1]) : null;

  if (leftCompare && rightCompare) {
    return (
      <PicklistCompare
        left={leftCompare}
        right={rightCompare}
        canDecide={canEdit}
        statsByTeamNumber={analyticsQuery.data?.teams ?? {}}
        onPrefer={handlePrefer}
        onCancel={exitCompare}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Alliance picklist
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {compareSelecting
              ? `Select ${2 - comparePair.length} team${2 - comparePair.length === 1 ? "" : "s"} to compare.`
              : "Drag with the grip to reorder. Drop into DNP to ban a team. Cross off teams already taken."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Event
            <select
              value={selectedEventId}
              onChange={(changeEvent) => {
                const eventId = changeEvent.target.value;
                if (eventId) {
                  window.localStorage.setItem(
                    PICKLIST_EVENT_STORAGE_KEY,
                    eventId,
                  );
                } else {
                  window.localStorage.removeItem(PICKLIST_EVENT_STORAGE_KEY);
                }
                window.dispatchEvent(new Event(PICKLIST_EVENT_CHANGE));
              }}
              className="ml-2 max-w-64 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 dark:border-[#1a1a1a] dark:bg-[#0a0a0a] dark:text-slate-200"
              disabled={eventsQuery.isPending}
            >
              <option value="">
                {eventsQuery.isPending ? "Loading events…" : "Select event"}
              </option>
              {eventsQuery.data?.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} · {event.date}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              if (compareSelecting) {
                exitCompare();
                return;
              }
              setCompareSelecting(true);
              setComparePair([]);
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
              compareSelecting
                ? "border-orange-500/40 bg-orange-500/15 text-orange-600 dark:text-orange-400"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1a1a1a] dark:text-slate-300 dark:hover:bg-[#121212]"
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {compareSelecting ? "Cancel compare" : "Compare"}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={compareSelecting ? undefined : handleDragStart}
        onDragOver={canEdit && !compareSelecting ? handleDragOver : undefined}
        onDragEnd={canEdit && !compareSelecting ? handleDragEnd : undefined}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <DropColumn
            id="ranked"
            title="Ranked"
            hint="1 = first alliance pick"
            emptyText="No teams ranked yet. Add from a scout form or drag here."
            items={rankedIds}
            noteById={noteById}
            canEdit={canEdit}
            showRank
            compareSelecting={compareSelecting}
            compareSelectedIds={comparePair}
            onOpenNote={handleCardClick}
            onToggleCrossOff={onToggleCrossOff}
          />
          <DropColumn
            id="dnp"
            title="Do not pick"
            hint="Broken bots, bad auto fit, avoid"
            emptyText="DNP list is empty."
            items={dnpIds}
            noteById={noteById}
            canEdit={canEdit}
            showRank={false}
            compareSelecting={compareSelecting}
            compareSelectedIds={comparePair}
            onOpenNote={handleCardClick}
            onToggleCrossOff={onToggleCrossOff}
          />
        </div>

        <DragOverlay>
          {activeNote ? (
            <div className="rounded-xl border border-orange-500/40 bg-white px-3 py-3 shadow-lg dark:bg-[#0a0a0a]">
              <PickCardBody
                note={activeNote}
                rankLabel={
                  rankedIds.includes(activeNote.id)
                    ? String(rankedIds.indexOf(activeNote.id) + 1)
                    : null
                }
                crossedOff={activeNote.crossedOff}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
