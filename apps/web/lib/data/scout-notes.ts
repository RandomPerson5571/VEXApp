import "server-only";

import { Prisma, prisma } from "@stlvex/database";
import { scoutNoteInclude } from "@stlvex/database/types";

const scoutNoteSelect = {
  id: true,
  teamId: true,
  targetTeamNumber: true,
  targetTeamName: true,
  content: true,
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
  createdById: string;
};

export type UpdateScoutNoteInput = {
  noteId: string;
  teamId: string;
  targetTeamNumber?: string;
  targetTeamName?: string | null;
  content?: string;
};

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
    return await prisma.scoutNote.create({
      data: {
        teamId: input.teamId,
        targetTeamNumber,
        targetTeamName: input.targetTeamName?.trim() || null,
        content: input.content ?? "",
        createdById: input.createdById,
      },
      select: scoutNoteSelect,
    });
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

  try {
    return await prisma.scoutNote.update({
      where: { id: input.noteId },
      data,
      select: scoutNoteSelect,
    });
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

export async function deleteScoutNote(
  noteId: string,
  teamId: string,
): Promise<void> {
  const existing = await prisma.scoutNote.findUnique({
    where: { id: noteId },
    select: { id: true, teamId: true },
  });
  if (!existing || existing.teamId !== teamId) {
    throw new Error("Scout note not found.");
  }

  await prisma.scoutNote.delete({ where: { id: noteId } });
}
