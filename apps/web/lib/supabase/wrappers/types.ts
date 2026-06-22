import type {
  Documentation,
  DocType,
  Event,
  EventType,
  Folder,
  Prisma,
  Team,
  User,
  UserRole,
} from "@stlvex/database/types";

export type {
  Documentation,
  DocType,
  Event,
  EventType,
  Folder,
  Prisma,
  Team,
  User,
  UserRole,
};

export type UserWithTeam = User & { team: Team | null };

export type TeamWithMembers = Team & { members: User[] };

export type EventWithTeams = Event & { teams: Team[] };

export type DocumentationWithRelations = Documentation & {
  authors: User[];
  folder: Folder;
};
