import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Phone, Mail, User, Clock, CheckCircle, XCircle,
  Loader2, ChevronDown, Calendar as CalendarIcon
} from 'lucide-react';
import { visitorBookingService, VisitorBooking } from '../../../services/visitorBookingService';
import { notifySuccess, notifyError } from '../../../utils/toast';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
  confirmed: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
  completed: 'bg-blue-50 border-blue-200 text-blue-700',
};

const callTypeStyles: Record<string, string> = {
  intro: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rapid: 'bg-slate-900 text-white border-slate-900',
};

export const VisitorBookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<VisitorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await visitorBookingService.fetchAll();
    if (data) setBookings(data);
    if (error) notifyError(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id: string, status: VisitorBooking['status']) => {
    setUpdatingId(id);
    const { error } = await visitorBookingService.updateStatus(id, status);
    if (error) {
      notifyError(error);
    } else {
      notifySuccess(`Booking ${status}`);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } as VisitorBooking : b));
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Visitor Bookings</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Incoming call requests from website visitors</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center shadow-sm">
          <CalendarIcon size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-bold text-slate-400">No visitor bookings yet</p>
          <p className="text-[10px] text-slate-300 font-medium mt-1">Bookings will appear here when visitors schedule calls</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, idx) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 border border-slate-200 shrink-0">
                      {booking.visitor_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{booking.visitor_name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${callTypeStyles[booking.call_type]}`}>
                          {booking.call_type === 'rapid' ? 'Rapid Response' : 'Intro Call'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Mail size={11} />
                          {booking.visitor_email}
                        </span>
                        {booking.visitor_phone && (
                          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <Phone size={11} />
                            {booking.visitor_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon size={12} />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {booking.time}
                    </span>
                    {booking.created_at && (
                      <span className="text-slate-300">
                        Booked {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      {booking.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[booking.status || 'pending']}`}>
                    {booking.status || 'pending'}
                  </span>
                  {booking.status === 'pending' && (
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleStatusUpdate(booking.id!, 'confirmed')}
                        disabled={updatingId === booking.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        {updatingId === booking.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking.id!, 'cancelled')}
                        disabled={updatingId === booking.id}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        {updatingId === booking.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      </button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id!, 'completed')}
                      disabled={updatingId === booking.id}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 text-nowrap"
                    >
                      {updatingId === booking.id ? <Loader2 size={12} className="animate-spin" /> : 'Mark Complete'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
