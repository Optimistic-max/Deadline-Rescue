// Deadlines are plain calendar dates ("2026-09-27"), not instants. Formatting
// or parsing them through UTC shifts them by a day for anyone not on UTC, so
// everything here works in the device's local time zone.

/** Formats a Date as YYYY-MM-DD using local calendar fields. */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The device's current calendar date as YYYY-MM-DD. */
export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}

/**
 * Parses a YYYY-MM-DD deadline into local midnight.
 * `new Date("2026-09-27")` would parse as UTC midnight instead, which lands on
 * the previous day for negative UTC offsets.
 */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
