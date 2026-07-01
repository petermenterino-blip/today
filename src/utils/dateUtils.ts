/**
 * Utility for handling dates in New Jersey (Eastern Time)
 */

export const NJ_TIMEZONE = 'America/New_York';

/**
 * Formats a date string or object to New Jersey relative format
 */
export function formatToNJ(date: string | Date | number, options: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: NJ_TIMEZONE,
    ...options
  });
}

/**
 * Returns ISO string adjusted for NJ (useful for database/storage)
 * Note: This keeps the local time but sets the Z offset, which is a bit of a hack 
 * but common for the requested "everything in NJ time" feel.
 * Better yet, just return the local string or use a proper library like luxon.
 * For this app, we'll favor clean display.
 */
export function getNJISOString(): string {
  const now = new Date();
  const njTime = now.toLocaleString('en-US', { timeZone: NJ_TIMEZONE });
  const njDate = new Date(njTime);
  return njDate.toISOString();
}

/**
 * Formats for dashboard display
 */
export function formatDashboardDate(date: string | Date): string {
  return formatToNJ(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
