import { formatToNJ, getNJISOString, formatDashboardDate } from '../dateUtils';

describe('formatToNJ', () => {
  it('formats a date string with default options', () => {
    const result = formatToNJ('2025-01-15T12:00:00Z');
    expect(result).toContain('2025');
    expect(result).toContain('1');
  });

  it('formats with custom options', () => {
    const result = formatToNJ('2025-01-15T12:00:00Z', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('handles number timestamps', () => {
    const timestamp = new Date('2025-07-01T12:00:00Z').getTime();
    const result = formatToNJ(timestamp, {
      month: 'short',
      day: 'numeric',
    });
    expect(result).toContain('Jul');
    expect(result).toContain('1');
  });
});

describe('getNJISOString', () => {
  it('returns ISO-like string with Z suffix', () => {
    const result = getNJISOString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('formatDashboardDate', () => {
  it('formats date for dashboard display', () => {
    const result = formatDashboardDate('2025-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });
});
