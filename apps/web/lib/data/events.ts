import "server-only";

import { prisma } from "@stlvex/database";
import type { Event, EventType, Prisma } from "@stlvex/database/types";

import { logTelemetry } from "@/lib/telemetry/dispatch";
import {
  formatTelemetryDateTime,
  telemetryFields,
  truncateTelemetryValue,
} from "@/lib/telemetry/detail";
import {
  eventCreatedMessage,
  eventDeletedMessage,
  eventUpdatedMessage,
} from "@/lib/telemetry/messages";

const eventCreatorSelect = {
  creator: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.EventInclude;

export type EventWithCreator = Prisma.EventGetPayload<{
  include: typeof eventCreatorSelect;
}>;

export type CreateEventInput = {
  name: string;
  description?: string | null;
  location: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  teamId: string;
  forAllTeams?: boolean;
  createdById?: string | null;
};

export async function listEventsForTeam(
  teamId: string,
): Promise<EventWithCreator[]> {
  return prisma.event.findMany({
    where: {
      teams: {
        some: { id: teamId },
      },
    },
    include: eventCreatorSelect,
    orderBy: { startDate: "asc" },
  });
}

export async function createEventForTeam(
  input: CreateEventInput,
): Promise<EventWithCreator> {
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
      createdById: input.createdById ?? null,
      teams: {
        connect: teamConnect,
      },
    },
    include: eventCreatorSelect,
  }).then((event) => {
    logTelemetry({
      category: "info",
      teamId: input.teamId,
      message: eventCreatedMessage(event.name),
      action: "event.created",
      entityType: "event",
      entityId: event.id,
      actorId: input.createdById ?? undefined,
      occurredAt: event.createdAt,
      fields: telemetryFields({
        Name: event.name,
        Type: event.type,
        Location: event.location,
        Start: formatTelemetryDateTime(event.startDate),
        End: formatTelemetryDateTime(event.endDate),
        Description: event.description
          ? truncateTelemetryValue(event.description)
          : undefined,
        "For all teams": input.forAllTeams ? "Yes" : "No",
      }),
    });
    return event;
  });
}

export type UpdateEventInput = {
  eventId: string;
  teamId: string;
  actorId?: string;
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
): Promise<EventWithCreator> {
  if (input.endDate <= input.startDate) {
    throw new Error("End time must be after start time.");
  }

  await findTeamEventOrThrow(input.eventId, input.teamId);

  const event = await prisma.event.update({
    where: { id: input.eventId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      location: input.location.trim(),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
    },
    include: eventCreatorSelect,
  });

  logTelemetry({
    category: "info",
    teamId: input.teamId,
    message: eventUpdatedMessage(event.name),
    action: "event.updated",
    entityType: "event",
    entityId: event.id,
    actorId: input.actorId,
    occurredAt: event.createdAt,
    fields: telemetryFields({
      Name: event.name,
      Type: event.type,
      Location: event.location,
      Start: formatTelemetryDateTime(event.startDate),
      End: formatTelemetryDateTime(event.endDate),
      Description: event.description
        ? truncateTelemetryValue(event.description)
        : undefined,
    }),
  });

  return event;
}

export async function deleteEventForTeam(
  eventId: string,
  teamId: string,
  actorId?: string,
): Promise<void> {
  const event = await findTeamEventOrThrow(eventId, teamId);
  await prisma.event.delete({ where: { id: eventId } });
  logTelemetry({
    category: "info",
    teamId,
    message: eventDeletedMessage(event.name),
    action: "event.deleted",
    entityType: "event",
    entityId: event.id,
    actorId,
    occurredAt: new Date(),
    fields: telemetryFields({
      Name: event.name,
      Type: event.type,
      Location: event.location,
      Start: formatTelemetryDateTime(event.startDate),
      End: formatTelemetryDateTime(event.endDate),
    }),
  });
}
