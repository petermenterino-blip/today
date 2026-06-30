import React from 'react';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import type { CalendarView } from '../hooks/useCalendar';

interface CalendarToolbarProps {
  title: string;
  currentDate: Date;
  currentView: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpToDate: (dateStr: string) => void;
  onViewChange: (view: CalendarView) => void;
}

const VIEWS: CalendarView[] = ['month', 'week', 'day', 'agenda'];

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  title,
  currentDate,
  currentView,
  onPrev,
  onNext,
  onToday,
  onJumpToDate,
  onViewChange,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 mb-8 py-2">
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onPrev}
          className="p-3 hover:bg-slate-50 border border-slate-100/80 rounded-2xl transition-all active:scale-95 shadow-sm text-slate-600 hover:text-black"
          title="Previous"
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 select-none min-w-[220px] md:min-w-[280px]">
          {title}
        </h2>

        <button
          onClick={onNext}
          className="p-3 hover:bg-slate-50 border border-slate-100/80 rounded-2xl transition-all active:scale-95 shadow-sm text-slate-600 hover:text-black"
          title="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onToday}
          className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-100/80 hover:border-slate-200 text-slate-700 hover:text-black font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-sm active:scale-95"
        >
          Today
        </button>

        <div className="relative flex items-center gap-2 bg-white border border-slate-100/80 rounded-2xl px-3.5 py-2 shadow-sm hover:border-slate-200 focus-within:border-slate-300 transition-all cursor-pointer">
          <CalendarIcon className="text-slate-400" size={14} />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 select-none">
            {currentDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
          <input
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={(e) => onJumpToDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center bg-slate-100 p-1.5 rounded-[20px] shadow-inner border border-slate-200/40">
        {VIEWS.map(view => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-6 py-2.5 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
              currentView === view
                ? 'bg-black text-white shadow-md'
                : 'text-slate-500 hover:text-black hover:bg-slate-50/50'
            }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};
