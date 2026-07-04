import React from 'react';

interface Props {
  todaySessions: number;
  pendingReviews: number;
  unreadMessages: number;
  applications: number;
  onStatClick: (type: string) => void;
}

export const SummaryStatsRow: React.FC<Props> = ({ todaySessions, pendingReviews, unreadMessages, applications, onStatClick }) => {
  const items = [
    { label: "Today's Sessions", value: todaySessions, key: 'sessions' },
    { label: 'Pending Reviews', value: pendingReviews, key: 'feedback' },
    { label: 'Unread Messages', value: unreadMessages, key: 'messaging' },
    { label: 'Applications', value: applications, key: 'applications' },
  ];
  return (
    <div className="pt-6 grid grid-cols-4 gap-4 border-t border-white/10">
      {items.map(item => (
        <div key={item.key} className="cursor-pointer group" onClick={() => onStatClick(item.key)}>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">{item.label}</p>
          <p className="text-lg md:text-xl font-black text-white mt-1 group-hover:text-indigo-300 transition-colors">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};
