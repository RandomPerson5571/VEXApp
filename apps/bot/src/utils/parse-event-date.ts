const FRIENDLY_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/;

const DATE_FORMAT_HINT = "`MM/DD/YYYY HH:mm` (e.g. `06/27/2026 14:00`)";

export function parseEventDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const friendlyMatch = trimmed.match(FRIENDLY_DATE_PATTERN);

  if (friendlyMatch) {
    const [, month, day, year, hour, minute] = friendlyMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    );

    if (
      parsed.getFullYear() === Number(year) &&
      parsed.getMonth() === Number(month) - 1 &&
      parsed.getDate() === Number(day) &&
      parsed.getHours() === Number(hour) &&
      parsed.getMinutes() === Number(minute)
    ) {
      return parsed;
    }

    return null;
  }

  const isoParsed = new Date(trimmed);

  if (Number.isNaN(isoParsed.getTime())) {
    return null;
  }

  return isoParsed;
}

export function eventDateFormatHint(): string {
  return DATE_FORMAT_HINT;
}
