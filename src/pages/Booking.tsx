import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check, ArrowLeft, Zap, Video, Sparkles, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifyError, notifySuccess } from '../utils/toast';
import { visitorBookingService } from '../services/visitorBookingService';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const callType = (searchParams.get('type') || 'intro') as 'intro' | 'rapid';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [selectedDate, setSelectedDate] = useState<number | null>(12);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  // Guest fields (when not logged in)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [bookError, setBookError] = useState<string | null>(null);

  const isRapid = callType === 'rapid';

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const slots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM', '08:00 PM'];

  const handleConfirm = async () => {
    if (!selectedTime || !selectedDate) return;

    if (!user && (!guestName || !guestEmail)) {
      notifyError('Please provide your name and email.');
      return;
    }

    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

    try {
      if (user) {
        // Authenticated booking flow
        const m = await import('../services/bookingService');
        await m.bookingService.insert({
          user_id: user.id,
          user_name: user.name,
          date: formattedDate,
          time: selectedTime,
          type: isRapid ? 'Rapid Response Call' : '1:1 Program Intro Call',
          status: 'confirmed',
        });
      } else {
        // Visitor booking flow
        await visitorBookingService.submit({
          visitor_name: guestName,
          visitor_email: guestEmail,
          visitor_phone: guestPhone || undefined,
          call_type: callType,
          date: formattedDate,
          time: selectedTime,
        });
      }

      setIsBooked(true);
      setTimeout(() => navigate('/'), 3000);
    } catch {
      setBookError('Failed to confirm booking. Please try again.');
    }
  };

  if (isBooked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className={`w-20 h-20 ${isRapid ? 'bg-black' : 'bg-slate-900'} text-white rounded-full flex items-center justify-center mb-6 shadow-2xl`}>
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
          {isRapid ? 'Response Call Booked!' : 'Intro Call Booked!'}
        </h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {user ? 'Syncing with your calendar...' : 'We will reach out to confirm your slot.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 lg:py-12 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 sm:mb-12 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Header — changes based on call type */}
      <div className="text-center mb-8 sm:mb-16">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${isRapid ? 'bg-black text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
          {isRapid ? <Zap size={14} /> : <Video size={14} />}
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isRapid ? 'Rapid Response Call' : '1:1 Program Intro Call'}
          </span>
        </div>
        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 sm:mb-4 ${isRapid ? 'text-black' : 'text-slate-900'}`}>
          {isRapid ? 'URGENT? LOCK IN.' : 'BOOK YOUR CALL.'}
        </h1>
        <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium">
          {isRapid
            ? 'High-intensity 60-min strategy session. Immediate tactical solutions.'
            : '30-minute discovery call. Zero pressure, total clarity.'}
        </p>
      </div>

      {/* Guest info form (shown when not logged in) */}
      {!user && (
        <div className={`max-w-2xl mx-auto mb-8 p-6 sm:p-8 rounded-[32px] border ${isRapid ? 'bg-black border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h3 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isRapid ? 'text-white' : 'text-slate-900'}`}>
            <User size={16} />
            Your Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-[8px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Full Name *</label>
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all ${isRapid ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white' : 'bg-slate-50 border border-slate-100 text-black placeholder:text-slate-400 focus:border-black'}`}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className={`text-[8px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Email *</label>
              <input
                type="email"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all ${isRapid ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white' : 'bg-slate-50 border border-slate-100 text-black placeholder:text-slate-400 focus:border-black'}`}
                placeholder="john@example.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={`text-[8px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Phone (Optional)</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={e => setGuestPhone(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all ${isRapid ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white' : 'bg-slate-50 border border-slate-100 text-black placeholder:text-slate-400 focus:border-black'}`}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Calendar & Time Slots */}
      <div className={`rounded-[32px] sm:rounded-[48px] overflow-hidden grid grid-cols-1 lg:grid-cols-2 ${isRapid ? 'bg-black border border-white/10 shadow-2xl' : 'bg-white border border-black/[0.03] shadow-2xl'}`}>
        {/* Calendar Grid */}
        <div className={`p-6 sm:p-10 md:p-12 border-b lg:border-b-0 lg:border-r ${isRapid ? 'border-white/10' : 'border-black/[0.02]'}`}>
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h3 className={`text-[11px] sm:text-sm font-black uppercase tracking-widest ${isRapid ? 'text-white' : 'text-slate-900'}`}>May 2026</h3>
            <div className="flex gap-1 sm:gap-2">
              <button className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={16} /></button>
              <button className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-4 sm:mb-6">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isRapid ? 'text-white/30' : 'text-slate-300'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square flex items-center justify-center text-[10px] sm:text-xs font-black rounded-lg sm:rounded-2xl transition-all active:scale-90 ${
                  selectedDate === day
                    ? isRapid
                      ? 'bg-white text-black shadow-lg scale-110'
                      : 'bg-black text-white shadow-lg scale-110'
                    : isRapid
                      ? 'text-white/60 hover:bg-white/10'
                      : 'text-slate-600 hover:bg-slate-50'
                } ${[1, 7, 14, 21, 28].includes(day) ? 'opacity-10 pointer-events-none' : ''}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className={`p-6 sm:p-10 md:p-12 flex flex-col ${isRapid ? 'bg-white/5' : 'bg-slate-50/50'}`}>
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${isRapid ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-black/[0.03] text-black'} border rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm`}>
              <Clock size={18} />
            </div>
            <div>
              <div className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Available Windows</div>
              <div className={`text-[11px] sm:text-sm font-black uppercase ${isRapid ? 'text-white' : 'text-slate-900'}`}>May {selectedDate}, 2026</div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 flex-1">
            {slots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`w-full p-4 sm:p-5 flex items-center justify-between rounded-2xl sm:rounded-3xl border transition-all active:scale-[0.98] ${
                  selectedTime === slot
                    ? isRapid
                      ? 'bg-black border-white/30 text-white shadow-lg'
                      : 'bg-white border-black shadow-lg'
                    : isRapid
                      ? 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                      : 'bg-white border-black/[0.03] hover:border-black/10'
                }`}
              >
                <span className={`font-black text-[10px] sm:text-[11px] uppercase tracking-widest ${isRapid && selectedTime !== slot ? 'text-white/70' : selectedTime === slot ? 'text-white' : 'text-slate-900'}`}>{slot}</span>
                {selectedTime === slot && <Check size={14} className={isRapid ? 'text-white' : 'text-black'} />}
              </button>
            ))}
          </div>

          {bookError && (
            <p className="text-[10px] font-bold text-rose-400 text-center mt-4">{bookError}</p>
          )}

          {/* Pricing badge */}
          {isRapid && (
            <div className="mt-6 p-4 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-between">
              <span className="text-white/70 text-xs font-medium">Session Investment</span>
              <span className="text-white font-black text-lg">$25</span>
            </div>
          )}

          <button
            disabled={!selectedTime}
            onClick={handleConfirm}
            className={`mt-6 sm:mt-8 btn-normal w-full flex items-center justify-center gap-2 ${
              selectedTime
                ? isRapid
                  ? 'bg-white text-black hover:bg-slate-100 shadow-xl'
                  : 'bg-black text-white hover:bg-slate-800'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isRapid ? <Zap size={16} /> : <Video size={16} />}
            {isRapid ? 'Confirm & Pay Later' : 'Confirm Free Call'}
          </button>
          <p className={`mt-4 sm:mt-6 text-[7px] sm:text-[8px] text-center font-black uppercase tracking-[0.2em] ${isRapid ? 'text-white/30' : 'text-slate-400'}`}>
            Timezone: EST (New York)
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;