import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, Trash, X, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Notification as NotificationType } from '../interfaces';

const NotificationDropdown: React.FC = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">
                  <CheckCheck size={12} /> Mark All Read
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-slate-300" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell size={20} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No notifications</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => { markAsRead(n.id); setOpen(false); }}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Delete notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
