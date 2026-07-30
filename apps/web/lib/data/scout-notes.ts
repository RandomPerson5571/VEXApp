import "server-only";

import { Prisma, prisma } from "@stlvex/database";
import { scoutNoteInclude } from "@stlvex/database/types";

import { logTelemetry } from "@/lib/telemetry/dispatch";
import {
  telemetryFields,
  truncateTelemetryValue,
} from "@/lib/telemetry/detail";
import {
  scoutNoteCreatedMessage,
  scoutNoteDeletedMessage,
  scoutNoteUpdatedMessage,
} from "@/lib/telemetry/messages";

const scoutNoteSelect = {
  id: true,
  teamId: true,
  targetTeamNumber: true,
  targetTeamName: true,
  content: true,
  driveRating: true,
  autonReliability: true,
  mechanisms: true,
  formNotes: true,
  pickRank: true,
  doNotPick: true,
  crossedOff: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: scoutNoteInclude.createdBy,
} satisfies Prisma.ScoutNoteSelect;

export type ScoutNoteRecord = Prisma.ScoutNoteGetPayload<{
  select: typeof scoutNoteSelect;
}>;

export type CreateScoutNoteInput = {
  teamId: string;
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
  createdById: string;
};

export type UpdateScoutNoteInput = {
  noteId: string;
  teamId: string;
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

export type ReorderScoutNotesInput = {
  teamId: string;
  orderedNoteIds: string[];
  dnpNoteIds?: string[];
};

function normalizeRating(value: number | null | undefined, label: string) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer from 1 to 5.`);
  }
  return value;
}

function normalizePickRank(value: number | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Pick rank must be a positive integer.");
  }
  return value;
}

export async function listScoutNotes(teamId: string): Promise<ScoutNoteRecord[]> {
  return prisma.scoutNote.findMany({
    where: { teamId },
    select: scoutNoteSelect,
    orderBy: { targetTeamNumber: "asc" },
  });
}

export async function getScoutNoteById(
  noteId: string,
): Promise<ScoutNoteRecord | null> {
  return prisma.scoutNote.findUnique({
    where: { id: noteId },
    select: scoutNoteSelect,
  });
}

export async function createScoutNote(
  input: CreateScoutNoteInput,
): Promise<ScoutNoteRecord> {
  const targetTeamNumber = input.targetTeamNumber.trim().toUpperCase();
  if (!targetTeamNumber) {
    throw new Error("Team number is required.");
  }

  try {
    const note = await prisma.scoutNote.create({
      data: {
        teamId: input.teamId,
        targetTeamNumber,
        targetTeamName: input.targetTeamName?.trim() || null,
        content: input.content ?? "",
        driveRating: normalizeRating(input.driveRating, "Drive rating") ?? null,
        autonReliability:
          normalizeRating(input.autonReliability, "Auton reliability") ?? null,
        mechanisms: input.mechanisms?.trim() || null,
        formNotes: input.formNotes?.trim() || null,
        pickRank: normalizePickRank(input.pickRank) ?? null,
        doNotPick: input.doNotPick ?? false,
        crossedOff: input.crossedOff ?? false,
        createdById: input.createdById,
      },
      select: scoutNoteSelect,
    });
    logTelemetry({
      category: "info",
      teamId: input.teamId,
      message: scoutNoteCreatedMessage(note.targetTeamNumber),
      action: "scout_note.created",
      entityType: "scout_note",
      entityId: note.id,
      actorId: input.createdById,
      occurredAt: note.createdAt,
      fields: telemetryFields({
        "Target team": note.targetTeamNumber,
        "Target name": note.targetTeamName ?? undefined,
        Content: note.content ? truncateTelemetryValue(note.content) : undefined,
        "Drive rating": note.driveRating ?? undefined,
        "Auton reliability": note.autonReliability ?? undefined,
        Mechanisms: note.mechanisms ?? undefined,
        "Pick rank": note.pickRank ?? undefined,
        "Do not pick": note.doNotPick,
        "Crossed off": note.crossedOff,
      }),
    });
    return note;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A note for that team already exists.");
    }
    throw error;
  }
}

export async function updateScoutNote(
  input: UpdateScoutNoteInput,
): Promise<ScoutNoteRecord> {
  const existing = await prisma.scoutNote.findUnique({
    where: { id: input.noteId },
    select: { id: true, teamId: true },
  });
  if (!existing || existing.teamId !== input.teamId) {
    throw new Error("Scout note not found.");
  }

  const data: Prisma.ScoutNoteUpdateInput = {};
  if (input.targetTeamNumber !== undefined) {
    const targetTeamNumber = input.targetTeamNumber.trim().toUpperCase();
    if (!targetTeamNumber) {
      throw new Error("Team number is required.");
    }
    data.targetTeamNumber = targetTeamNumber;
  }
  if (input.targetTeamName !== undefined) {
    data.targetTeamName = input.targetTeamName?.trim() || null;
  }
  if (input.content !== undefined) {
    data.content = input.content;
  }
  if (input.driveRating !== undefined) {
    data.driveRating = normalizeRating(input.driveRating, "Drive rating");
  }
  if (input.autonReliability !== undefined) {
    data.autonReliability = normalizeRating(
      input.autonReliability,
      "Auton reliability",
    );
  }
  if (input.mechanisms !== undefined) {
    data.mechanisms = input.mechanisms?.trim() || null;
  }
  if (input.formNotes !== undefined) {
    data.formNotes = input.formNotes?.trim() || null;
  }
  if (input.pickRank !== undefined) {
    data.pickRank = normalizePickRank(input.pickRank);
  }
  if (input.doNotPick !== undefined) {
    data.doNotPick = input.doNotPick;
    if (input.doNotPick) {
      data.pickRank = null;
    }
  }
  if (input.crossedOff !== undefined) {
    data.crossedOff = input.crossedOff;
  }

  try {
    const note = await prisma.scoutNote.update({
      where: { id: input.noteId },
      data,
      select: scoutNoteSelect,
    });
    logTelemetry({
      category: "info",
      teamId: input.teamId,
      message: scoutNoteUpdatedMessage(note.targetTeamNumber),
      action: "scout_note.updated",
      entityType: "scout_note",
      entityId: note.id,
      occurredAt: note.updatedAt,
      fields: telemetryFields({
        "Target team": note.targetTeamNumber,
        "Target name": note.targetTeamName ?? undefined,
        Content: note.content ? truncateTelemetryValue(note.content) : undefined,
        "Drive rating": note.driveRating ?? undefined,
        "Auton reliability": note.autonReliability ?? undefined,
        Mechanisms: note.mechanisms ?? undefined,
        "Pick rank": note.pickRank ?? undefined,
        "Do not pick": note.doNotPick,
        "Crossed off": note.crossedOff,
      }),
    });
    return note;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A note for that team already exists.");
    }
    throw error;
  }
}

export async function reorderScoutNotes(
  input: ReorderScoutNotesInput,
): Promise<ScoutNoteRecord[]> {
  const orderedNoteIds = input.orderedNoteIds;
  const dnpNoteIds = input.dnpNoteIds ?? [];

  const orderedSet = new Set(orderedNoteIds);
  const dnpSet = new Set(dnpNoteIds);
  for (const id of dnpNoteIds) {
    if (orderedSet.has(id)) {
      throw new Error("A note cannot be both ranked and DNP.");
    }
  }
  if (orderedSet.size !== orderedNoteIds.length) {
    throw new Error("Duplicate note ids in ranked list.");
  }
  if (dnpSet.size !== dnpNoteIds.length) {
    throw new Error("Duplicate note ids in DNP list.");
  }

  const allIds = [...orderedNoteIds, ...dnpNoteIds];
  if (allIds.length > 0) {
    const notes = await prisma.scoutNote.findMany({
      where: { id: { in: allIds }, teamId: input.teamId },
      select: { id: true },
    });
    if (notes.length !== allIds.length) {
      throw new Error("One or more scout notes were not found.");
    }
  }

  // Payload is the full picklist: clear anything previously ranked/DNP but omitted.
  await prisma.$transaction([
    prisma.scoutNote.updateMany({
      where: {
        teamId: input.teamId,
        OR: [{ pickRank: { not: null } }, { doNotPick: true }],
        ...(allIds.length > 0 ? { id: { notIn: allIds } } : {}),
      },
      data: { pickRank: null, doNotPick: false },
    }),
    ...orderedNoteIds.map((id, index) =>
      prisma.scoutNote.update({
        where: { id },
        data: { pickRank: index + 1, doNotPick: false },
      }),
    ),
    ...dnpNoteIds.map((id) =>
      prisma.scoutNote.update({
        where: { id },
        data: { pickRank: null, doNotPick: true },
      }),
    ),
  ]);

  return listScoutNotes(input.teamId);
}

export async function deleteScoutNote(
  noteId: string,
  teamId: string,
  actorId?: string,
): Promise<void> {
  const existing = await prisma.scoutNote.findUnique({
    where: { id: noteId },
    select: { id: true, teamId: true, targetTeamNumber: true, targetTeamName: true },
  });
  if (!existing || existing.teamId !== teamId) {
    throw new Error("Scout note not found.");
  }

  await prisma.scoutNote.delete({ where: { id: noteId } });
  logTelemetry({
    category: "info",
    teamId,
    message: scoutNoteDeletedMessage(existing.targetTeamNumber),
    action: "scout_note.deleted",
    entityType: "scout_note",
    entityId: noteId,
    actorId,
    occurredAt: new Date(),
    fields: telemetryFields({
      "Target team": existing.targetTeamNumber,
      "Target name": existing.targetTeamName ?? undefined,
    }),
  });
}
