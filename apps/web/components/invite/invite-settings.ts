const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getDefaultInviteExpiryValue(): string {
  return toDatetimeLocalValue(new Date(Date.now() + DEFAULT_INVITE_TTL_MS));
}

export const DEFAULT_MAX_USES = 1;
