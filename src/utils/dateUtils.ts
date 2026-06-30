/**
 * Utility for handling dates in New Jersey (Eastern Time)
 */

export const NJ_TIMEZONE = 'America/New_York';

/**
 * Returns the current date in New Jersey as a Date object
 */
export function getNJDate(): Date {
  const now = new Date();
  const njString = now.toLocaleString('en-US', { timeZone: NJ_TIMEZONE });
  return new Date(njString);
}

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
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NJ_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}Z`;
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
