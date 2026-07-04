import React, { useState, useEffect } from 'react';
import { History, Eye } from 'lucide-react';

interface RecentlyViewedItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  label: string;
}

interface Props {
  onItemClick?: (item: RecentlyViewedItem) => void;
}

const STORAGE_KEY = 'mentorino_recently_viewed';

export const RecentlyViewedWidget: React.FC<Props> = ({ onItemClick }) => {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const displayItems = items.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm min-h-[320px]">
      <div className="mb-6">
        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Recently Viewed</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your recent activity</p>
      </div>
      <div className="space-y-3">
        {displayItems.length > 0 ? (
          displayItems.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              onClick={() => onItemClick?.(item)}
              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Eye size={12} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{item.title}</p>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <History className="mx-auto text-slate-300 mb-2" size={24} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recently viewed items</p>
          </div>
        )}
      </div>
    </div>
  );
};

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'timestamp'>) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: RecentlyViewedItem[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter(i => !(i.id === item.id && i.type === item.type));
    filtered.unshift({ ...item, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {}
}
