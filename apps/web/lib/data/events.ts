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
