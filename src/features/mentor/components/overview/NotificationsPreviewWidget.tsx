import React from 'react';
import { Bell, ChevronRight, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onViewAll: () => void;
}

export const NotificationsPreviewWidget: React.FC<Props> = ({ notifications, loading, unreadCount, onViewAll }) => {
  const latest = notifications.slice(0, 5);

  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">NOTIFICATIONS</h4>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <button onClick={onViewAll} className="text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View All <ChevronRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-300" size={20} /></div>
      ) : (
        <div className="space-y-2">
          {latest.length > 0 ? (
            latest.map((n) => (
              <div key={n.id} className={`p-2.5 rounded-xl flex items-start gap-3 ${n.read ? 'bg-white border border-transparent' : 'bg-indigo-50/60 border border-indigo-100/60'}`}>
                <Bell size={12} className={n.read ? 'text-slate-300 mt-0.5' : 'text-indigo-600 mt-0.5'} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold truncate ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
                  <p className="text-[9px] text-slate-400 truncate">{n.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Bell className="mx-auto text-slate-300 mb-1" size={20} />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
