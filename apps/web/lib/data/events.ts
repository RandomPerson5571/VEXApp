import "server-only";

import { prisma } from "@stlvex/database";
import type { Event, EventType } from "@stlvex/database/types";

export type CreateEventInput = {
  name: string;
  description?: string | null;
  location: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  teamId: string;
  forAllTeams?: boolean;
};

export async function listEventsForTeam(teamId: string): Promise<Event[]> {
  return prisma.event.findMany({
    where: {
      teams: {
        some: { id: teamId },
      },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function createEventForTeam(input: CreateEventInput): Promise<Event> {
  if (input.endDate <= input.startDate) {
    throw new Error("End time must be after start time.");
  }

  // ponytail: connect every team when forAllTeams; no Event.isGlobal flag
  const teamConnect = input.forAllTeams
    ? (await prisma.team.findMany({ select: { id: true } })).map((team) => ({
        id: team.id,
      }))
    : [{ id: input.teamId }];

  if (teamConnect.length === 0) {
    throw new Error("No teams found.");
  }

  return prisma.event.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      location: input.location.trim(),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      teams: {
        connect: teamConnect,
      },
    },
  });
}

export type UpdateEventInput = {
  eventId: string;
  teamId: string;
  name: string;
  description?: string | null;
  location: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
};

async function findTeamEventOrThrow(
  eventId: string,
  teamId: string,
): Promise<Event> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      teams: { some: { id: teamId } },
    },
  });

  if (!event) {
    throw new Error("Event not found.");
  }

  return event;
}

export async function updateEventForTeam(
  input: UpdateEventInput,
): Promise<Event> {
  if (input.endDate <= input.startDate) {
    throw new Error("End time must be after start time.");
  }

  await findTeamEventOrThrow(input.eventId, input.teamId);

  return prisma.event.update({
    where: { id: input.eventId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      location: input.location.trim(),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

export async function deleteEventForTeam(
  eventId: string,
  teamId: string,
): Promise<void> {
  await findTeamEventOrThrow(eventId, teamId);
  await prisma.event.delete({ where: { id: eventId } });
}
