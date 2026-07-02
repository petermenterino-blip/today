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

export function getNJISOString(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: NJ_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const p = (type: string) => {
    const v = fmt.formatToParts(now).find(x => x.type === type)?.value;
    return v ? v.padStart(2, '0') : '00';
  };

  const offsetFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: NJ_TIMEZONE,
    timeZoneName: 'longOffset',
  });
  const offsetStr = offsetFmt.formatToParts(now).find(x => x.type === 'timeZoneName')?.value || 'GMT-05:00';
  const m = offsetStr.replace('GMT', '').match(/([+-])(\d{2}):(\d{2})/);
  const offsetFormatted = m ? `${m[1]}${m[2]}:${m[3]}` : '-05:00';

  return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}:${p('second')}.000${offsetFormatted}`;
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
