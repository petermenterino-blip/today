import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Search, Send, Calendar, Clock, Video, ExternalLink, CheckCircle, Users, ChevronRight, Loader2, Star, TrendingUp, AlertTriangle, Check } from 'lucide-react';
import type { Application, StudentProfile } from '../../../../types';
import { notifySuccess, notifyError } from '../../../../utils/toast';
import { messageService } from '../../../../services/messageService';

interface ReviewApplicationsModalProps {
  open: boolean;
  onClose: () => void;
  pendingApplications: Application[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewProfile: (userId: string) => void;
}

export const ReviewApplicationsModal: React.FC<ReviewApplicationsModalProps> = ({ open, onClose, pendingApplications, onAccept, onReject, onViewProfile }) => {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Review Applications</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pendingApplications.length} pending</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {pendingApplications.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><CheckCircle className="mx-auto mb-2" size={32} /><p className="text-xs font-bold uppercase tracking-wider">No pending applications</p></div>
          ) : (
            pendingApplications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(app => (
              <div key={app.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs">{app.full_name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{app.full_name}</p>
                      <p className="text-[10px] text-slate-400">{app.focus_area || app.mentor_type || 'Mentorship'} • {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full ${app.status === 'pending' ? 'bg-amber-50 text-amber-600' : app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{app.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAccept(app.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-600 transition-colors">Accept</button>
                  <button onClick={() => onReject(app.id)} className="px-3 py-1.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-red-600 transition-colors">Reject</button>
                  <button onClick={() => onViewProfile(app.user_id || app.id)} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-300 transition-colors flex items-center gap-1"><ExternalLink size={10} />Profile</button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

interface StartSessionModalProps {
  open: boolean;
  onClose: () => void;
  nextSession: any;
  studentProfiles: StudentProfile[];
  onOpenSession: (session: any) => void;
  onScheduleNew: () => void;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({ open, onClose, nextSession, studentProfiles, onOpenSession, onScheduleNew }) => {
  if (!open) return null;
  const hasUpcoming = nextSession && new Date(nextSession.startTime).getTime() - Date.now() < 30 * 60 * 1000;
  const student = nextSession ? studentProfiles.find(p => p.user_id === nextSession.studentId) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Start Session</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{hasUpcoming ? 'Session available now' : 'Schedule a new session'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {hasUpcoming && nextSession ? (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-3">
                <Video className="text-indigo-600" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{nextSession.title}</p>
                  <p className="text-xs text-slate-500">{student?.name || 'Student'} • {new Date(nextSession.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                </div>
              </div>
              {nextSession.meetingUrl && (
                <a href={nextSession.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                  <ExternalLink size={12} /> {nextSession.meetingUrl}
                </a>
              )}
              <button onClick={() => { onOpenSession(nextSession); onClose(); }} className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors">Open Session Now</button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <Calendar className="mx-auto text-slate-300" size={32} />
              <p className="text-sm font-bold text-slate-600">No upcoming sessions in the next 30 minutes</p>
              <button onClick={() => { onScheduleNew(); onClose(); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors">Schedule New Session</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

interface QuickMessageModalProps {
  open: boolean;
  onClose: () => void;
  studentProfiles: StudentProfile[];
  currentUserId?: string;
  onSendMessage: (studentId: string, content: string) => void;
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({ open, onClose, studentProfiles, currentUserId, onSendMessage }) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const filtered = studentProfiles.filter(p => {
    const name = (p.name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleSend = async () => {
    if (!selectedStudent || !message.trim()) return;
    setSending(true);
    try {
      await onSendMessage(selectedStudent, message);
      notifySuccess('Message sent');
      setMessage('');
      setSelectedStudent(null);
      onClose();
    } catch { notifyError('Failed to send'); }
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Quick Message</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search and message students</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-200 border border-slate-100" />
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {filtered.slice(0, 10).map(p => (
              <button key={p.user_id} onClick={() => setSelectedStudent(p.user_id)} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedStudent === p.user_id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">{p.name?.slice(0, 2).toUpperCase() || '?'}</div>
                <span className="text-xs font-bold text-slate-900">{p.name || p.email}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No students found</p>}
          </div>

          {selectedStudent && (
            <div className="space-y-3">
              <textarea
                placeholder="Type your message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-200 border border-slate-100 resize-none h-[80px]"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send Message
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

interface MiniCalendarModalProps {
  open: boolean;
  onClose: () => void;
  sessions: any[];
  onOpenSession: (session: any) => void;
  onViewCalendar: () => void;
}

export const MiniCalendarModal: React.FC<MiniCalendarModalProps> = ({ open, onClose, sessions, onOpenSession, onViewCalendar }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  if (!open) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= lastDay; i++) days.push(i);

  const today = new Date();
  const getSessionsForDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => s.startTime?.startsWith(dStr));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Calendar</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight size={14} className="rotate-180" /></button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight size={14} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (<div key={d} className="py-1">{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="py-2" />;
              const sessionsOnDay = getSessionsForDay(day);
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <button key={day} className={`py-2 text-[10px] rounded-xl relative ${isToday ? 'bg-indigo-600 text-white font-black' : 'text-slate-700 hover:bg-indigo-50/40'}`}>
                  <span>{day}</span>
                  {sessionsOnDay.length > 0 && <span className={`w-1 h-1 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 ${isToday ? 'bg-white' : 'bg-indigo-600'}`} />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 pt-4 mt-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Today</p>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {getSessionsForDay(today.getDate()).slice(0, 3).map(s => (
                <div key={s.id} onClick={() => { onOpenSession(s); onClose(); }} className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100/60 cursor-pointer hover:bg-indigo-50 transition-colors flex items-center gap-2">
                  <Clock size={12} className="text-indigo-600" />
                  <span className="text-[10px] font-bold text-slate-700">{s.title}</span>
                  <span className="text-[9px] text-indigo-600 ml-auto">{new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              ))}
              {getSessionsForDay(today.getDate()).length === 0 && <p className="text-[10px] text-slate-400 text-center py-2">No sessions today</p>}
            </div>
          </div>
          <button onClick={() => { onViewCalendar(); onClose(); }} className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors">Open Full Calendar</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface GrowthAuditModalProps {
  open: boolean;
  onClose: () => void;
  atRiskStudents: any[];
  engagementRate: number;
  sessionCompletionRate: number;
  studentCounts: { accepted: number; active: number; notArchived: number; assigned: number };
  onViewAnalytics: () => void;
}

export const GrowthAuditModal: React.FC<GrowthAuditModalProps> = ({ open, onClose, atRiskStudents, engagementRate, sessionCompletionRate, studentCounts, onViewAnalytics }) => {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Growth Audit</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time mentor performance analysis</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Engagement</p>
              <p className="text-2xl font-black text-emerald-700">{engagementRate}%</p>
              <p className="text-[9px] text-emerald-500 mt-1">Student active rate</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Session Completion</p>
              <p className="text-2xl font-black text-indigo-700">{sessionCompletionRate}%</p>
              <p className="text-[9px] text-indigo-500 mt-1">Sessions held</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Active Students</p>
              <p className="text-2xl font-black text-amber-700">{studentCounts.active}</p>
              <p className="text-[9px] text-amber-500 mt-1">Of {studentCounts.assigned} total</p>
            </div>
            <div className={`p-4 rounded-2xl border ${atRiskStudents.length > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-[9px] font-black uppercase tracking-wider ${atRiskStudents.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>At Risk</p>
              <p className={`text-2xl font-black ${atRiskStudents.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{atRiskStudents.length}</p>
              <p className={`text-[9px] mt-1 ${atRiskStudents.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>Students needing attention</p>
            </div>
          </div>

          {atRiskStudents.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">Students Needing Attention</p>
              <div className="space-y-2">
                {atRiskStudents.slice(0, 5).map(s => (
                  <div key={s.studentId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500">{s.reason}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full ${s.riskLevel === 'high' ? 'bg-red-50 text-red-600' : s.riskLevel === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {s.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <p className="text-[10px] font-black uppercase tracking-wider opacity-80">AI Recommendation</p>
            <p className="text-sm font-bold mt-1">
              {atRiskStudents.length > 0
                ? `Focus on ${atRiskStudents[0].name} — ${atRiskStudents[0].suggestedAction}. Schedule a 1:1 session to address their risk factors.`
                : 'All students are on track. Continue monitoring engagement and providing regular feedback.'}
            </p>
          </div>

          <button onClick={() => { onViewAnalytics(); onClose(); }} className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <TrendingUp size={12} /> View Full Analytics
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface BroadcastModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (title: string, content: string, recipients: string) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ open, onClose, onSend }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState('all');
  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-tighter">Quick Broadcast</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" placeholder="Subject" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-200 border border-slate-100" />
          <textarea placeholder="Broadcast message..." value={content} onChange={e => setContent(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-200 border border-slate-100 resize-none h-[120px]" />
          <select value={recipients} onChange={e => setRecipients(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-200 border border-slate-100">
            <option value="all">All Students</option>
            <option value="active">Active Students</option>
            <option value="atrisk">At-Risk Students</option>
          </select>
          <button onClick={() => { onSend(title, content, recipients); setTitle(''); setContent(''); onClose(); }} disabled={!title.trim() || !content.trim()} className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={12} /> Send Broadcast
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
