import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { Booking, User } from '../types';
import { formatToNJ } from '../utils/dateUtils';

interface BookingPageProps {
  onBook: (booking: Booking) => void | Promise<void>;
  currentUser: User | null;
}

const BookingPage: React.FC<BookingPageProps> = ({ onBook, currentUser }) => {
  const navigate = useNavigate();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [selectedDate, setSelectedDate] = React.useState<number | null>(12);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [isBooked, setIsBooked] = React.useState(false);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const slots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM', '08:00 PM'];

  const [bookError, setBookError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedTime || !selectedDate || !currentUser) return;
    
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    const newBooking: Booking = {
      id: `b_${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      date: formattedDate,
      time: selectedTime,
      type: 'Strategy Session',
      status: 'confirmed'
    };
    
    try {
      await onBook(newBooking);
      setIsBooked(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      setBookError('Failed to confirm booking. Please try again.');
    }
  };

  if (isBooked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Session Confirmed!</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing with your strategic calendar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 lg:py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 sm:mb-12 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="text-center mb-8 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 sm:mb-4">Book Session.</h1>
        <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium">Select a window for strategic mentorship focus.</p>
      </div>

      <div className="bg-white rounded-[32px] sm:rounded-[48px] border border-black/[0.03] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Calendar Grid */}
        <div className="p-6 sm:p-10 md:p-12 border-b lg:border-b-0 lg:border-r border-black/[0.02]">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h3 className="text-[11px] sm:text-sm font-black uppercase tracking-widest text-slate-900">May 2026</h3>
            <div className="flex gap-1 sm:gap-2">
              <button className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
              <button className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-4 sm:mb-6">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {days.map(day => (
              <button 
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square flex items-center justify-center text-[10px] sm:text-xs font-black rounded-lg sm:rounded-2xl transition-all active:scale-90
                  ${selectedDate === day 
                    ? 'bg-black text-white shadow-lg sm:shadow-xl scale-110' 
                    : 'text-slate-600 hover:bg-slate-50'}
                  ${[1, 7, 14, 21, 28].includes(day) ? 'opacity-10 pointer-events-none' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="p-6 sm:p-10 md:p-12 bg-slate-50/50 flex flex-col">
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.03] rounded-xl sm:rounded-2xl flex items-center justify-center text-black shadow-sm">
              <Clock size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Windows</div>
              <div className="text-[11px] sm:text-sm font-black uppercase">May {selectedDate}, 2026</div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 flex-1">
            {slots.map(slot => (
              <button 
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`
                  w-full p-4 sm:p-5 flex items-center justify-between rounded-2xl sm:rounded-3xl border transition-all active:scale-[0.98]
                  ${selectedTime === slot 
                    ? 'bg-white border-black shadow-lg sm:shadow-xl' 
                    : 'bg-white border-black/[0.03] hover:border-black/10'}
                `}
              >
                <span className="font-black text-[10px] sm:text-[11px] text-slate-900 uppercase tracking-widest">{slot}</span>
                {selectedTime === slot && <Check size={14} className="sm:w-4 sm:h-4 text-black" />}
              </button>
            ))}
          </div>

          {bookError && (
            <p className="text-[10px] font-bold text-rose-600 text-center mt-4">{bookError}</p>
          )}
          <button 
            disabled={!selectedTime}
            onClick={handleConfirm}
            className={`
              mt-8 sm:mt-10 btn-normal w-full
              ${selectedTime 
                ? 'bg-black text-white hover:bg-slate-800' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
            Confirm Session
          </button>
          <p className="mt-4 sm:mt-6 text-[7px] sm:text-[8px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">
            Timezone: EST (New York)
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;