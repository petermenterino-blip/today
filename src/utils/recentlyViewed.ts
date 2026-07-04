const STORAGE_KEY = 'recently_viewed_events';
const MAX_ITEMS = 20;

export interface RecentlyViewedEvent {
  id: string;
  title: string;
  date: string;
  eventType?: string;
  image?: string;
  viewedAt: string;
}

export function trackRecentlyViewed(event: { id: string; title: string; date: string; eventType?: string; image?: string }) {
  const existing = getRecentlyViewed();
  const filtered = existing.filter(e => e.id !== event.id);
  filtered.unshift({ ...event, viewedAt: new Date().toISOString() });
  const trimmed = filtered.slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function getRecentlyViewed(): RecentlyViewedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
