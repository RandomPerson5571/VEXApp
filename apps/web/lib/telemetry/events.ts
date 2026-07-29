export type TelemetryUrgency = "routine" | "actionable" | "security";

/** Fixed v1 map — admins route via channels, not per-event toggles. */
export const TELEMETRY_EVENTS = {
  tasksCompleted: "routine",
  scoutNotesSaved: "routine",
  partsReturned: "routine",
  lowStock: "actionable",
  calendarEventCreated: "actionable",
  inviteGenerated: "actionable",
  userSuppressed: "security",
  userKicked: "security",
  userBanned: "security",
  userUnbanned: "security",
  githubUnlinked: "security",
  adminRoleGranted: "security",
} as const satisfies Record<string, TelemetryUrgency>;

export type TelemetryEventKey = keyof typeof TELEMETRY_EVENTS;

export type DigestCounters = Partial<Record<TelemetryEventKey, number>>;

const DIGEST_LABELS: Record<string, string> = {
  tasksCompleted: "tasks completed",
  scoutNotesSaved: "scout notes saved",
  partsReturned: "parts returned",
};

export function formatDigestSummary(counters: DigestCounters): string {
  const parts: string[] = [];
  for (const [key, count] of Object.entries(counters)) {
    if (typeof count !== "number" || count <= 0) continue;
    const label = DIGEST_LABELS[key] ?? key;
    parts.push(`${count} ${label}`);
  }
  return parts.length > 0 ? parts.join(", ") : "No activity.";
}

export function mergeDigestCounters(
  existing: DigestCounters,
  delta: DigestCounters,
): DigestCounters {
  const next: DigestCounters = { ...existing };
  for (const [key, value] of Object.entries(delta) as [
    TelemetryEventKey,
    number,
  ][]) {
    if (typeof value !== "number" || value <= 0) continue;
    next[key] = (next[key] ?? 0) + value;
  }
  return next;
}
