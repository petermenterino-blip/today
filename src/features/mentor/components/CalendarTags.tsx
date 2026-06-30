import React from 'react';
import { getSessionStyle } from './calendarUtils';
import type { CalendarTag } from './calendarUtils';

interface CalendarTagsProps {
  tags?: CalendarTag[];
}

const HARDCODED_TAGS = [
  { name: '1:1', color: '#10b981' },
  { name: 'Group', color: '#3b82f6' },
  { name: 'Workshop', color: '#f59e0b' },
  { name: 'Review', color: '#ef4444' },
  { name: 'Cancelled', color: '#64748b' },
];

export const CalendarTags: React.FC<CalendarTagsProps> = ({ tags }) => {
  const displayTags = tags && tags.length > 0
    ? tags.map(t => ({ name: t.name, color: t.color }))
    : HARDCODED_TAGS;

  return (
    <div className="mb-6 p-4 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-wrap items-center justify-between gap-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calendar Tags</span>
      <div className="flex flex-wrap items-center gap-2">
        {displayTags.map(tag => {
          const style = getSessionStyle(tag.name, undefined, tags || []);
          return (
            <div
              key={tag.name}
              className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all shadow-sm"
              style={style.style}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: style.indicator }} />
              <span>{tag.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
