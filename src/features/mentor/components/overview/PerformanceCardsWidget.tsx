import React from 'react';
import { ThumbsUp, Target, Calendar, CheckCircle, FileText, MessageSquare, Users, Clock } from 'lucide-react';

interface PerformanceData {
  studentSatisfaction: number;
  attendance: number;
  sessionsThisWeek: number;
  completionRate: number;
  assignmentsReviewed: number;
  messagesReplied: number;
  applicationsProcessed: number;
  avgResponseTime: string;
}

interface Props {
  data: PerformanceData;
  onCardClick?: (key: string) => void;
}

const PERFORMANCE_CARDS = [
  { key: 'studentSatisfaction', label: 'Satisfaction', icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'attendance', label: 'Attendance', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'sessionsThisWeek', label: 'Sessions/Week', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'completionRate', label: 'Completion', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'assignmentsReviewed', label: 'Assignments', icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'messagesReplied', label: 'Messages', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'applicationsProcessed', label: 'Applications', icon: Users, color: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'avgResponseTime', label: 'Response Time', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export const PerformanceCardsWidget: React.FC<Props> = ({ data, onCardClick }) => {
  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
      <div className="mb-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">PERFORMANCE</h4>
        <p className="text-sm font-black text-brand-charcoal uppercase tracking-tighter">Mentor KPIs</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PERFORMANCE_CARDS.map(card => {
          const Icon = card.icon;
          const value = data[card.key as keyof PerformanceData];
          const displayValue = typeof value === 'number' && card.key !== 'sessionsThisWeek' && card.key !== 'assignmentsReviewed' && card.key !== 'messagesReplied' && card.key !== 'applicationsProcessed'
            ? `${value}%` : value;
          return (
            <button
              key={card.key}
              onClick={() => onCardClick?.(card.key)}
              className={`p-3 rounded-2xl ${card.bg} border border-transparent hover:shadow-sm transition-all text-left`}
            >
              <Icon size={14} className={card.color} />
              <p className="text-base font-black text-slate-900 mt-1">{displayValue}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{card.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
