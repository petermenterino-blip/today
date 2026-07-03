import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, X, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const DROPDOWN_WIDTH = 320;
const DROPDOWN_MAX_HEIGHT = 384;
const VIEWPORT_MARGIN = 12;

const NotificationDropdown: React.FC = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + VIEWPORT_MARGIN;
    let left = rect.right - DROPDOWN_WIDTH;

    if (left + DROPDOWN_WIDTH > vw - VIEWPORT_MARGIN) {
      left = vw - DROPDOWN_WIDTH - VIEWPORT_MARGIN;
    }

    if (left < VIEWPORT_MARGIN) {
      left = VIEWPORT_MARGIN;
    }

    if (top + DROPDOWN_MAX_HEIGHT > vh - VIEWPORT_MARGIN) {
      const spaceAbove = rect.top - VIEWPORT_MARGIN;
      const spaceBelow = vh - rect.bottom - VIEWPORT_MARGIN;

      if (spaceAbove >= DROPDOWN_MAX_HEIGHT || spaceAbove >= spaceBelow) {
        top = rect.top - DROPDOWN_MAX_HEIGHT - VIEWPORT_MARGIN;
      } else {
        top = Math.max(VIEWPORT_MARGIN, vh - DROPDOWN_MAX_HEIGHT - VIEWPORT_MARGIN);
      }
    }

    if (top < VIEWPORT_MARGIN) {
      top = VIEWPORT_MARGIN;
    }

    setPosition({ top, left });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        position &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        const panelEl = document.getElementById('notification-panel');
        if (panelEl && !panelEl.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [position]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={buttonRef}
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

      {createPortal(
        <AnimatePresence>
          {open && position && (
            <motion.div
              id="notification-panel"
              key="notification-panel"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed w-80 max-h-96 bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden z-[100]"
              style={{
                top: position.top,
                left: position.left,
                transformOrigin: 'top right',
              }}
            >
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">
                    <CheckCheck size={12} /> Mark All Read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: DROPDOWN_MAX_HEIGHT - 57 }}>
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
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default NotificationDropdown;
