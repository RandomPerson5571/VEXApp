export const TABLES = {
  user: "User",
  team: "Team",
  event: "Event",
  folder: "Folder",
  documentation: "Documentation",
  teamEvents: "_TeamEvents",
  authoredDocs: "_AuthoredDocs",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
