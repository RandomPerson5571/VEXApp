export type TelemetryDetailField = { name: string; value: string };

export function formatTelemetryDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const iso = date.toISOString();
  const local = date.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });
  return `${local} (${iso})`;
}

export function telemetryField(
  name: string,
  value: string | number | boolean | null | undefined,
): TelemetryDetailField | null {
  if (value === null || value === undefined || value === "") return null;
  return { name, value: String(value) };
}

export function telemetryFields(
  entries: Record<string, string | number | boolean | null | undefined>,
): TelemetryDetailField[] {
  return Object.entries(entries)
    .map(([name, value]) => telemetryField(name, value))
    .filter((field): field is TelemetryDetailField => field !== null);
}

export function truncateTelemetryValue(
  value: string,
  maxLength = 1000,
): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
