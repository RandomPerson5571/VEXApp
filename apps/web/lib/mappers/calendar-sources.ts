export type CalendarSourcesStatus =
  | "loading"
  | "ok"
  | "team-unavailable"
  | "robotevents-unavailable"
  | "robotevents-unconfigured"
  | "both-unavailable";

export type CalendarSourcesInput = {
  teamPending: boolean;
  teamError: boolean;
  robotPending: boolean;
  robotError: boolean;
  robotConfigured: boolean;
  robotAvailable: boolean;
};

/**
 * Resolve merge/degradation state for team calendar (Supabase) + RobotEvents.
 */
export function resolveCalendarSourcesStatus(
  input: CalendarSourcesInput,
): CalendarSourcesStatus {
  if (input.teamPending || input.robotPending) {
    return "loading";
  }

  const teamOk = !input.teamError;
  const robotOk =
    !input.robotError &&
    (!input.robotConfigured || input.robotAvailable);

  if (!teamOk && !robotOk) return "both-unavailable";
  if (!teamOk) return "team-unavailable";
  if (input.robotError || (input.robotConfigured && !input.robotAvailable)) {
    return "robotevents-unavailable";
  }
  if (!input.robotConfigured) return "robotevents-unconfigured";
  return "ok";
}

export function calendarSourcesWarning(
  status: CalendarSourcesStatus,
): string | null {
  switch (status) {
    case "team-unavailable":
      return "Team schedule data is unavailable. Showing official RobotEvents only.";
    case "robotevents-unavailable":
      return "Official event data is unavailable. Showing your team schedule only.";
    case "robotevents-unconfigured":
      return "RobotEvents unavailable — set VEX_API_TOKEN to include official tournaments.";
    default:
      return null;
  }
}
