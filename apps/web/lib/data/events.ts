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

  return prisma.event.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      location: input.location.trim(),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      teams: {
        connect: { id: input.teamId },
      },
    },
  });
}
