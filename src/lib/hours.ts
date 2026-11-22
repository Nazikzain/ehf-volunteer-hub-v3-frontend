/** Hours between two datetime-local strings, rounded to 2 decimals; null if invalid or end is not after start. */
export function calcHours(start: string, end: string): number | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round((ms / 36e5) * 100) / 100;
}
