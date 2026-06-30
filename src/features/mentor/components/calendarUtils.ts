import { Session } from '../../../interfaces';

export interface CalendarTag {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface SchedulerSettings {
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
  defaultDuration: number;
  defaultPlatform: 'Google Meet' | 'Zoom' | 'Offline';
  bufferBetweenSessions: number;
  autoMeetLink: boolean;
  autoZoomLink: boolean;
  calendarSync: boolean;
  calendarTags: CalendarTag[];
}

export const DEFAULT_TAGS: CalendarTag[] = [
  { id: '1:1', name: '1:1', color: '#10b981', visible: true },
  { id: 'Group', name: 'Group', color: '#6366f1', visible: true },
  { id: 'Workshop', name: 'Workshop', color: '#f59e0b', visible: true },
  { id: 'Review', name: 'Review', color: '#f43f5e', visible: true },
  { id: 'Cancelled', name: 'Cancelled', color: '#94a3b8', visible: true },
];

export const DEFAULT_SETTINGS: SchedulerSettings = {
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  timezone: 'America/New_York',
  defaultDuration: 45,
  defaultPlatform: 'Google Meet',
  bufferBetweenSessions: 10,
  autoMeetLink: true,
  autoZoomLink: false,
  calendarSync: true,
  calendarTags: DEFAULT_TAGS,
};

export const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
];

export function hexToRGBA(hex: string, alpha: number): string {
  try {
    const cleanHex = (hex || '#10b981').replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${alpha})`;
  } catch {
    return `rgba(16, 185, 129, ${alpha})`;
  }
}

export function getTagForSession(session: Session, tags: CalendarTag[]): CalendarTag {
  const tagList = tags || DEFAULT_TAGS;
  if (session.status === 'cancelled') {
    return tagList.find(t => t.id === 'Cancelled' || t.name === 'Cancelled') || { ...DEFAULT_TAGS[4] };
  }
  const type = session.sessionType || '1:1';
  return tagList.find(t => t.name.toLowerCase() === type.toLowerCase()) || { id: 'unknown', name: type, color: '#10b981', visible: true };
}

export function getSessionStyle(type: string | undefined, status: string | undefined, tags: CalendarTag[]) {
  const tagList = tags || DEFAULT_TAGS;

  if (status === 'cancelled') {
    const cancelledTag = tagList.find(t => t.id === 'Cancelled' || t.name === 'Cancelled') || { color: '#94a3b8' };
    const color = cancelledTag.color;
    return {
      bg: hexToRGBA(color, 0.05),
      border: hexToRGBA(color, 0.15),
      text: color,
      indicator: color,
      style: {
        backgroundColor: hexToRGBA(color, 0.05),
        borderColor: hexToRGBA(color, 0.15),
        color: color,
        textDecoration: 'line-through' as const,
      },
    };
  }

  const sessionType = type || '1:1';
  const activeTag = tagList.find(t => t.name.toLowerCase() === sessionType.toLowerCase()) || { color: '#10b981' };
  const color = activeTag.color;
  return {
    bg: hexToRGBA(color, 0.08),
    border: hexToRGBA(color, 0.25),
    text: color,
    indicator: color,
    style: {
      backgroundColor: hexToRGBA(color, 0.08),
      borderColor: hexToRGBA(color, 0.25),
      color: color,
    },
  };
}
