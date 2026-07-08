import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, ChevronLeft, ChevronRight, Check, ArrowLeft,
  Zap, Video, Mail, Phone, User, Building2, GraduationCap, Briefcase,
  Star, MessageSquare, Globe, Loader2
} from 'lucide-react';
import { notifyError, notifySuccess } from '../utils/toast';
import { visitorBookingService } from '../services/visitorBookingService';
import { usePrograms } from '../hooks/usePrograms';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'America/Halifax', 'America/Phoenix', 'America/Toronto', 'America/Vancouver',
  'Pacific/Honolulu', 'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Guam',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Zurich',
  'Europe/Moscow', 'Europe/Istanbul', 'Europe/Dublin', 'Europe/Lisbon', 'Europe/Prague',
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul',
  'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Bangkok', 'Asia/Kuala_Lumpur', 'Asia/Manila',
  'Asia/Jakarta', 'Asia/Karachi', 'Asia/Dhaka', 'Asia/Colombo', 'Asia/Kathmandu',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Mexico_City', 'America/Bogota',
  'America/Santiago', 'America/Lima', 'America/Caracas', 'America/Puerto_Rico',
];

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

const MEETING_TYPES = [
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'in_person', label: 'In-Person', icon: User },
] as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const stepLabels = ['Contact', 'Details', 'Schedule', 'Confirm'];

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callType = (searchParams.get('type') || 'intro') as 'intro' | 'rapid';
  const isRapid = callType === 'rapid';
  const { programs, loading: programsLoading } = usePrograms();
  const publishedPrograms = programs.filter(p => p.status === 'published');
  const programOptions = publishedPrograms.map(p => ({ id: p.id, title: p.title }));

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const submittedRef = useRef(false);

  const [calViewDate, setCalViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(calViewDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(calViewDate.getFullYear());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [studentProfessional, setStudentProfessional] = useState<'student' | 'professional' | null>(null);
  const [programOfInterest, setProgramOfInterest] = useState('');
  const [preferredMentor, setPreferredMentor] = useState('Peter');
  const [meetingType, setMeetingType] = useState<'phone' | 'video' | 'in_person' | null>(null);
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('booking_form_state');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.step) setStep(p.step);
        if (p.name) setName(p.name);
        if (p.email) setEmail(p.email);
        if (p.phone) setPhone(p.phone);
        if (p.company) setCompany(p.company);
        if (p.studentProfessional) setStudentProfessional(p.studentProfessional);
        if (p.programOfInterest) setProgramOfInterest(p.programOfInterest);
        if (p.meetingType) setMeetingType(p.meetingType);
        if (p.selectedDate) setSelectedDate(p.selectedDate);
        if (p.selectedTime) setSelectedTime(p.selectedTime);
        if (p.selectedTimezone) setSelectedTimezone(p.selectedTimezone);
        if (p.message) setMessage(p.message);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isBooked) return;
    sessionStorage.setItem('booking_form_state', JSON.stringify({
      step, name, email, phone, company, studentProfessional,
      programOfInterest, meetingType, selectedDate, selectedTime,
      selectedTimezone, message,
    }));
  }, [step, name, email, phone, company, studentProfessional, programOfInterest, meetingType, selectedDate, selectedTime, selectedTimezone, message, isBooked]);

  const calYear = calViewDate.getFullYear();
  const calMonth = calViewDate.getMonth();

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
    const totalSlots = 42;
    const grid: (number | null)[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push(prevMonthDays - i);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(d);
    }
    while (grid.length < totalSlots) {
      const nextDay = grid.length - daysInMonth - firstDay + 1;
      grid.push(nextDay);
    }

    return grid;
  }, [calYear, calMonth]);

  const isToday = (day: number, isCurrent: boolean) => {
    if (!isCurrent) return false;
    const now = new Date();
    return now.getFullYear() === calYear && now.getMonth() === calMonth && now.getDate() === day;
  };

  const goToPrevMonth = useCallback(() => {
    setCalViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCalViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  }, []);

  const canGoNext = useCallback(() => {
    switch (step) {
      case 1: return name.trim() && email.trim() && phone.trim() && studentProfessional && !emailError;
      case 2: return programOfInterest && meetingType;
      case 3: return selectedDate !== null && selectedTime !== null;
      case 4: return true;
      default: return false;
    }
  }, [step, name, email, phone, studentProfessional, emailError, programOfInterest, meetingType, selectedDate, selectedTime]);

  const validateEmail = (val: string) => {
    setEmail(val);
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const formattedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

    const result = await visitorBookingService.submit({
      visitorName: name,
      visitorEmail: email,
      visitorPhone: phone,
      company: company || undefined,
      studentProfessional: studentProfessional || undefined,
      callType,
      preferredMentor: preferredMentor || undefined,
      programOfInterest,
      meetingType: meetingType || undefined,
      date: formattedDate,
      time: selectedTime,
      timezone: selectedTimezone,
      message: message || undefined,
      sourcePage: window.location.pathname,
      priority: 'medium',
    });

    if (result.error) {
      notifyError(result.error || 'Failed to submit booking. Please try again.');
      setSubmitting(false);
      return;
    }

    setIsBooked(true);
    sessionStorage.removeItem('booking_form_state');
    notifySuccess(isRapid ? 'Rapid response call booked!' : 'Intro call booked!');
    setTimeout(() => navigate('/'), 2000);
    setSubmitting(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
      {stepLabels.map((label, i) => {
        const idx = i + 1;
        const isActive = idx === step;
        const isDone = idx < step;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div data-testid={`booking-step-${idx}`} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            isDone
              ? 'bg-emerald-500 text-white'
              : isActive
                ? isRapid ? 'bg-black text-white' : 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-400'
          }`}>
            {isDone ? <Check size={14} /> : idx}
          </div>
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest hidden sm:block ${
                isActive ? isRapid ? 'text-black' : 'text-slate-900' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`w-8 sm:w-12 h-px ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderBackButton = () => (
    <button
      data-testid="booking-back"
      onClick={() => { if (step > 1) { setStep(s => s - 1); } else { sessionStorage.setItem('scrollToSection', 'pricing-options'); navigate(-1); } }}
      className="mb-8 sm:mb-12 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
    >
      <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-black group-hover:-translate-x-1 transition-transform" />
    </button>
  );

  const renderHeader = () => (
    <div className="text-center mb-8 sm:mb-12">
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
  );

  const renderFormSide = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
        Contact Information
      </h3>

      <div className="space-y-5">
        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name *</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              data-testid="booking-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-black transition-all placeholder:text-slate-400"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="booking-email" className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address *</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              id="booking-email"
              data-testid="booking-email"
              type="email"
              value={email}
              onChange={e => validateEmail(e.target.value)}
              className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border text-sm font-medium outline-none transition-all placeholder:text-slate-400 ${
                emailError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-100 focus:border-black'
              }`}
              placeholder="john@example.com"
              aria-describedby={emailError ? 'booking-email-error' : undefined}
            />
          </div>
          {emailError && <p id="booking-email-error" className="text-[8px] font-bold text-rose-400 mt-1.5" role="alert">{emailError}</p>}
        </div>

        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Phone Number *</label>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="tel"
              data-testid="booking-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-black transition-all placeholder:text-slate-400"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Company / Organization</label>
          <div className="relative">
            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-black transition-all placeholder:text-slate-400"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3 block">I am a *</label>
          <div className="flex gap-3">
            <button
              type="button"
              data-testid="booking-type-student"
              onClick={() => setStudentProfessional('student')}
              className={`flex-1 flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                studentProfessional === 'student'
                  ? isRapid ? 'bg-black border-black text-white' : 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
              }`}
            >
              <GraduationCap size={16} />
              Student
            </button>
            <button
              type="button"
              data-testid="booking-type-professional"
              onClick={() => setStudentProfessional('professional')}
              className={`flex-1 flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                studentProfessional === 'professional'
                  ? isRapid ? 'bg-black border-black text-white' : 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
              }`}
            >
              <Briefcase size={16} />
              Professional
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
        Request Details
      </h3>

      <div className="space-y-5">
        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program of Interest *</label>
          <div className="relative">
            <Star size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none z-10" />
            <select
              value={programOfInterest}
              onChange={e => setProgramOfInterest(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-black transition-all appearance-none cursor-pointer"
            >
              <option value="">{programsLoading ? 'Loading programs...' : programOptions.length === 0 ? 'No programs available' : 'Select a program'}</option>
              {programOptions.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Preferred Mentor</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={preferredMentor}
              readOnly
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-900 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Preferred Meeting Type *</label>
          <div className="flex gap-3">
            {MEETING_TYPES.map(mt => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setMeetingType(mt.value)}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                  meetingType === mt.value
                    ? isRapid ? 'bg-black border-black text-white' : 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                }`}
              >
                <mt.icon size={16} />
                {mt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Message</label>
          <div className="relative">
            <MessageSquare size={16} className="absolute left-4 top-4 text-slate-300" />
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-black transition-all placeholder:text-slate-400 resize-none"
              placeholder="Anything you'd like us to know..."
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
        Schedule
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`rounded-[32px] p-6 border ${isRapid ? 'bg-white border-black/10' : 'bg-white border-slate-100'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <button onClick={goToPrevMonth} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              {MONTHS[calMonth]} {calYear}
            </h4>
            <button onClick={goToNextMonth} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[8px] font-black uppercase tracking-widest text-slate-300 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarGrid.map((day, idx) => {
              const isCurrent = day !== null && day > 7 && day <= new Date(calYear, calMonth + 1, 0).getDate() + 7 && day <= new Date(calYear, calMonth + 1, 0).getDate() + 0;
              const inMonth = day !== null && !(idx < new Date(calYear, calMonth, 1).getDay() || day > new Date(calYear, calMonth + 1, 0).getDate());
              const dayNum = day || 0;
              const isSel = inMonth && selectedDate === dayNum;
              const todayCheck = isToday(dayNum, inMonth);
              return (
                <button
                  key={idx}
                  onClick={() => inMonth && setSelectedDate(dayNum)}
                  disabled={!inMonth}
                  className={`aspect-square flex items-center justify-center text-[9px] sm:text-[10px] font-black rounded-xl transition-all active:scale-90 ${
                    !inMonth
                      ? 'text-slate-200 pointer-events-none'
                      : isSel
                        ? isRapid ? 'bg-black text-white shadow-md scale-105' : 'bg-slate-900 text-white shadow-md scale-105'
                        : todayCheck
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-[32px] p-6 border ${isRapid ? 'bg-white border-black/10' : 'bg-white border-slate-100'} shadow-sm`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                <Clock size={16} className="text-slate-600" />
              </div>
              <div>
                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Available Times</div>
                <div className="text-[10px] font-black uppercase text-slate-900">
                  {selectedDate ? `${MONTHS[calMonth]} ${selectedDate}, ${calYear}` : 'Select a date'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`p-3 flex items-center justify-center gap-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all active:scale-[0.97] ${
                    selectedTime === slot
                      ? isRapid ? 'bg-black border-black text-white' : 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  <Clock size={12} />
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-[32px] p-5 border ${isRapid ? 'bg-white border-black/10' : 'bg-white border-slate-100'} shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <Globe size={16} className="text-slate-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Timezone</span>
            </div>
            <select
              value={selectedTimezone}
              onChange={e => setSelectedTimezone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-black transition-all appearance-none cursor-pointer"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
        Confirm Your Booking
      </h3>

      <div className="space-y-4">
        <div className={`rounded-[32px] p-6 border ${isRapid ? 'bg-white border-black/10' : 'bg-white border-slate-100'} shadow-sm`}>
          <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-4">Contact Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-medium text-slate-900">{name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium text-slate-900">{email}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-medium text-slate-900">{phone}</span></div>
            {company && <div className="flex justify-between"><span className="text-slate-400">Company</span><span className="font-medium text-slate-900">{company}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-medium text-slate-900 capitalize">{studentProfessional}</span></div>
          </div>
        </div>

        <div className={`rounded-[32px] p-6 border ${isRapid ? 'bg-white border-black/10' : 'bg-white border-slate-100'} shadow-sm`}>
          <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-4">Request Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Program</span><span className="font-medium text-slate-900">{programOptions.find(p => p.id === programOfInterest)?.title || programOfInterest}</span></div>
            {preferredMentor && <div className="flex justify-between"><span className="text-slate-400">Mentor</span><span className="font-medium text-slate-900">{preferredMentor}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Meeting</span><span className="font-medium text-slate-900 capitalize">{meetingType?.replace('_', ' ')}</span></div>
            {message && <div className="flex justify-between"><span className="text-slate-400">Message</span><span className="font-medium text-slate-900 max-w-[200px] text-right truncate">{message}</span></div>}
          </div>
        </div>

        <div className={`rounded-[32px] p-6 border ${isRapid ? 'bg-white border-black/10' : 'bg-white border-slate-100'} shadow-sm`}>
          <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-4">Schedule</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Date</span><span className="font-medium text-slate-900">{MONTHS[calMonth]} {selectedDate}, {calYear}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Time</span><span className="font-medium text-slate-900">{selectedTime}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Timezone</span><span className="font-medium text-slate-900">{selectedTimezone}</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSummaryCard = () => {
    return (
      <div className={`rounded-[32px] p-6 sm:p-8 border shadow-lg sticky top-24 ${isRapid ? 'bg-black border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isRapid ? 'bg-white/10' : 'bg-slate-100'}`}>
            {isRapid ? <Zap size={22} className={isRapid ? 'text-white' : 'text-slate-900'} /> : <Video size={22} className={isRapid ? 'text-white' : 'text-slate-900'} />}
          </div>
          <div>
            <div className={`text-[8px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Call Type</div>
            <div className="text-sm font-black uppercase tracking-tight">{isRapid ? 'Rapid Response' : 'Intro / Audit'}</div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Duration</span>
            <span className="text-sm font-bold">{isRapid ? '60 min' : '30 min'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isRapid ? 'text-white/50' : 'text-slate-400'}`}>Investment</span>
            {isRapid ? (
              <span className="text-2xl font-black">$25</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-black line-through text-slate-300">$250</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Free</span>
              </div>
            )}
          </div>
        </div>

        <div className={`h-px ${isRapid ? 'bg-white/10' : 'bg-slate-200'} my-4`} />

        {step === 4 ? (
          <div className="space-y-3">
            <button
              data-testid="booking-submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-slate-100 shadow-xl"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                <>Submit Booking</>
              )}
            </button>
            <p className={`text-[7px] text-center font-black uppercase tracking-[0.2em] ${isRapid ? 'text-white/30' : 'text-slate-400'}`}>
              You will receive a confirmation email
            </p>
          </div>
        ) : (
          <button
            data-testid="booking-continue"
            onClick={() => canGoNext() && setStep(s => Math.min(s + 1, 4))}
            disabled={!canGoNext()}
            className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              canGoNext()
                ? isRapid ? 'bg-white text-black hover:bg-slate-100 shadow-xl' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Continue → Next Step
          </button>
        )}
      </div>
    );
  };

  if (isBooked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-20 h-20 ${isRapid ? 'bg-black' : 'bg-slate-900'} text-white rounded-full flex items-center justify-center mb-6 shadow-2xl`}
        >
          <Check size={40} />
        </motion.div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
          {isRapid ? 'Response Call Booked!' : 'Intro Call Booked!'}
        </h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          We will reach out to confirm your slot. Check your email for details.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 lg:py-12 px-4">
      {renderBackButton()}
      {renderHeader()}
      {renderStepIndicator()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {renderFormSide()}
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => setStep(s => Math.max(s - 1, 1))}
                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back
              </button>
              <button
                data-testid="booking-next"
                onClick={() => canGoNext() && setStep(s => Math.min(s + 1, 4))}
                disabled={!canGoNext()}
                className={`px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-[0.98] ${
                  canGoNext()
                    ? isRapid ? 'bg-black text-white hover:bg-slate-800 shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                Next Step →
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {renderSummaryCard()}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
