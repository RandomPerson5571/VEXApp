export { SupabaseWrapperError } from "./errors";
export {
  ensureUserProfile,
  getAuthenticatedUser,
  type AuthenticatedContext,
} from "./context";
export {
  createEvent,
  getEventById,
  linkEventToTeam,
  listEventsForTeam,
  unlinkEventFromTeam,
  type CreateEventInput,
  type ListEventsOptions,
} from "./events";
export {
  createDoc,
  getDocWithAuthors,
  linkAuthorToDoc,
  listDocsInFolder,
  updateDoc,
  type CreateDocumentationInput,
  type UpdateDocumentationInput,
} from "./documentation";
export { getFolderById, listFolders } from "./folders";
export { parseDate, parseDates, unwrap, unwrapNullable } from "./result";
export { TABLES, type TableName } from "./tables";
export {
  getTeamById,
  getTeamForCurrentUser,
  getTeamWithMembers,
} from "./teams";
export type {
  DocumentationWithRelations,
  DocType,
  Documentation,
  Event,
  EventType,
  EventWithTeams,
  Folder,
  Prisma,
  Team,
  TeamWithMembers,
  User,
  UserRole,
  UserWithTeam,
} from "./types";
export {
  createUserProfile,
  getUserByAuthId,
  getUserByEmail,
  getUserWithTeam,
  linkAuthUserToProfile,
  updateUserProfile,
  type CreateUserProfileInput,
  type UserProfileUpdate,
} from "./users";
