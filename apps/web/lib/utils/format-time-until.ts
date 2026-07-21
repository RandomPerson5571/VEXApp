/** Relative countdown label for an upcoming event start. */
export function formatTimeUntil(start: Date, now: Date): string {
  const ms = start.getTime() - now.getTime();
  if (ms <= 0) return "Starting now";

  const hourMs = 1000 * 60 * 60;
  const dayMs = hourMs * 24;

  if (ms < dayMs) {
    const hours = Math.max(1, Math.ceil(ms / hourMs));
    return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  }

  // ponytail: floor full days — ceil(25h/24h) was wrongly "in 2 days"
  const days = Math.floor(ms / dayMs);
  return days === 1 ? "in 1 day" : `in ${days} days`;
}
