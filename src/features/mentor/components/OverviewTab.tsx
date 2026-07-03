import React from 'react';
import { motion } from 'motion/react';
import {
  Users, Bot, Calendar, CheckCircle, Activity, FileText, ClipboardList,
  ChevronRight, MessageSquare, ArrowLeft, CalendarDays, Megaphone,
  Send, Loader2, CheckCircle2, Sparkles as SparkleIcon, Plus
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { MentorTab } from '../hooks/useDashboard';

interface OverviewTabProps {
  handleTabChange: (tab: MentorTab) => void;
  getRecentActivityTimeline: () => any[];
  handleOpenStudentProfile: (studentId: string) => void;
  formatRelativeTime: (isoString: string) => string;
  getAtRiskStudents: () => any[];
  currentCalendarDate: Date;
  setCurrentCalendarDate: (d: Date) => void;
  selectedCalendarDate: Date | null;
  setSelectedCalendarDate: (d: Date | null) => void;
  getCalendarDays: () => (Date | null)[];
  getEventsOnDay: (date: Date) => any[];
  sessions: any[];
  studentProfiles: any[];
  applications: any[];
  conversations: any[];
  communities: any[];
  broadcastTitle: string;
  setBroadcastTitle: (v: string) => void;
  broadcastContent: string;
  setBroadcastContent: (v: string) => void;
  handleBroadcast: () => void;
  selectedChartTab: string;
  setSelectedChartTab: (v: any) => void;
  getChartData: () => any[];
  chatHistory: any[];
  userInput: string;
  setUserInput: (v: string) => void;
  isAiLoading: boolean;
  handleAiChat: () => void;
  programsLoading: boolean;
  programs: any[];
  setIsCreatingProgram: (v: boolean) => void;
  setProgramWizardStep: (v: number) => void;
  setIsSchedulingSession: (v: boolean) => void;
  sessionsFiltered: any[];
  pendingApplications: any[];
  pendingTasks: any[];
  conversationsUnread: number;
  activeStudentsCount: number;
  upcomingSessions: any[];
  allTags: any[];
  setActiveTab: (tab: MentorTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  handleTabChange, getRecentActivityTimeline, handleOpenStudentProfile,
  formatRelativeTime, getAtRiskStudents, currentCalendarDate,
  setCurrentCalendarDate, selectedCalendarDate, setSelectedCalendarDate,
  getCalendarDays, getEventsOnDay, sessions, studentProfiles, applications,
  conversations, communities, broadcastTitle, setBroadcastTitle,
  broadcastContent, setBroadcastContent, handleBroadcast,
  selectedChartTab, setSelectedChartTab, getChartData, chatHistory,
  userInput, setUserInput, isAiLoading, handleAiChat,
  programsLoading, programs, setIsCreatingProgram, setProgramWizardStep,
  setIsSchedulingSession, sessionsFiltered, pendingApplications,
  pendingTasks, conversationsUnread, activeStudentsCount, upcomingSessions,
  allTags, setActiveTab,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {(!programsLoading && programs.length === 0) ? (
        <div className="bg-brand-charcoal rounded-[32px] sm:rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-brand-charcoal/20 text-center max-w-3xl mx-auto my-8">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none hidden md:block select-none">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="4" fill="currentColor" />
              <circle cx="250" cy="150" r="6" fill="currentColor" />
              <circle cx="180" cy="280" r="8" fill="currentColor" />
              <circle cx="320" cy="220" r="5" fill="currentColor" />
              <circle cx="280" cy="320" r="4" fill="currentColor" />
              <circle cx="120" cy="200" r="6" fill="currentColor" />
              <path d="M100 100 L250 150 M250 150 L180 280 M180 280 L320 220 M320 220 L280 320 M120 200 L180 280 M100 100 L120 200 M250 150 L320 220" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="250" cy="150" r="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="animate-pulse" />
              <circle cx="180" cy="280" r="16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="animate-pulse" />
            </svg>
          </div>

          <div className="relative z-10 space-y-6">
            <h3 className="text-4xl font-black uppercase tracking-tighter">Welcome to Mentorino</h3>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
              Your executive command center is ready. Initialize your workspace by setting up your program and inviting your first cohort of students.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
              <button
                onClick={() => { setIsCreatingProgram(true); setProgramWizardStep(1); }}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-center transition-all group active:scale-95 text-left animate-in fade-in"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="text-white" size={20} />
                </div>
                <p className="font-bold text-xs text-white uppercase tracking-wider mb-1">Step 1</p>
                <p className="text-xs text-white/70 font-medium leading-snug">Create your first program</p>
              </button>
              <button
                onClick={() => handleTabChange('applications')}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-center transition-all group active:scale-95 text-left animate-in fade-in"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="text-white" size={20} />
                </div>
                <p className="font-bold text-xs text-white uppercase tracking-wider mb-1">Step 2</p>
                <p className="text-xs text-white/70 font-medium leading-snug">Invite your first students</p>
              </button>
              <button
                onClick={() => { setIsSchedulingSession(true); handleTabChange('sessions'); }}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-center transition-all group active:scale-95 text-left animate-in fade-in"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="text-white" size={20} />
                </div>
                <p className="font-bold text-xs text-white uppercase tracking-wider mb-1">Step 3</p>
                <p className="text-xs text-white/70 font-medium leading-snug">Schedule your first session</p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN HERO CARD */}
          <div className="bg-brand-charcoal rounded-[32px] sm:rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-brand-charcoal/20 animate-in fade-in duration-500">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none hidden md:block select-none">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="4" fill="currentColor" />
                <circle cx="250" cy="150" r="6" fill="currentColor" />
                <circle cx="180" cy="280" r="8" fill="currentColor" />
                <circle cx="320" cy="220" r="5" fill="currentColor" />
                <circle cx="280" cy="320" r="4" fill="currentColor" />
                <circle cx="120" cy="200" r="6" fill="currentColor" />
                <path d="M100 100 L250 150 M250 150 L180 280 M180 280 L320 220 M320 220 L280 320 M120 200 L180 280 M100 100 L120 200 M250 150 L320 220" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="250" cy="150" r="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="animate-pulse" />
                <circle cx="180" cy="280" r="16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="animate-pulse" />
              </svg>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-10 gap-8 items-start">
              <div className="md:col-span-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
                    MENTOR COMMAND CENTER
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                      Mentoring workspace active
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Today's Priorities</p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-white/90 font-semibold">
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
                      <span>Review {pendingApplications.length} new application{pendingApplications.length !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                      <span>
                        {upcomingSessions.length > 0 ? (
                          <>Conduct "{upcomingSessions[0].title}" Session ({(() => {
                            try { const date = new Date(upcomingSessions[0].startTime); return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }); } catch { return "Scheduled"; }
                          })()})</>
                        ) : (
                          <>No sessions scheduled for today</>
                        )}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"></span>
                      <span>Respond to {conversationsUnread} unread student message{conversationsUnread !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0"></span>
                      <span>Approve {pendingTasks.length} pending assignment{pendingTasks.length !== 1 ? 's' : ''}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10">
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Today's Sessions</p>
                    <p className="text-lg md:text-xl font-black text-white mt-1">
                      {sessions.filter(s => { if (!s.startTime) return false; return new Date(s.startTime).toDateString() === new Date().toDateString(); }).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Pending Reviews</p>
                    <p className="text-lg md:text-xl font-black text-white mt-1">{pendingTasks.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Unread Messages</p>
                    <p className="text-lg md:text-xl font-black text-white mt-1">{conversationsUnread}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 grid grid-cols-2 gap-x-6 gap-y-6 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10 h-full">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Current Program</p>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">{programs[0]?.title || 'Career Foundations'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Active Batch</p>
                  <p className="text-xs sm:text-sm font-bold text-white">Batch A</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Active Students</p>
                  <p className="text-xs sm:text-sm font-bold text-white">{activeStudentsCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Next Session</p>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    {upcomingSessions[0] ? (
                      <>Today • {(() => { try { const date = new Date(upcomingSessions[0].startTime); return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }); } catch { return "Scheduled"; }})()}</>
                    ) : ('None Scheduled')}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTabChange('applications')}
              className="w-full mt-6 group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-left transition-all hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] shadow-lg shadow-purple-600/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">New Applications</p>
                    <p className="text-3xl font-black text-white mt-0.5">{pendingApplications.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest">Review</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </button>

            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3 items-center relative z-10">
              <button onClick={() => handleTabChange('applications')} className="px-5 py-2.5 bg-white text-brand-charcoal hover:bg-slate-100 font-bold rounded-2xl text-[11px] transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-left">Review Applications</button>
              <button onClick={() => handleTabChange('sessions')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-[11px] transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-left">Start Session</button>
              <button onClick={() => handleTabChange('messaging')} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-[11px] transition-all active:scale-95 flex items-center gap-1.5 border border-white/5 text-left">Message Students</button>
              <button onClick={() => handleTabChange('events')} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-[11px] transition-all active:scale-95 flex items-center gap-1.5 border border-white/5 text-left">View Calendar</button>
              <button onClick={() => handleTabChange('growth-audit')} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-[11px] transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-left">Growth Audit</button>
            </div>
          </div>

          {/* PROGRESS PANEL: MENTOR OPERATIONAL METRICS */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">OVERALL MENTORING HEALTH</h4>
              <p className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">OPERATIONAL METRICS</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Student Engagement', value: 82, color: 'from-emerald-500 to-teal-600', desc: 'Average active participation rate' },
                { label: 'Session Completion', value: 91, color: 'from-indigo-500 to-blue-600', desc: 'Scheduled meetings successfully held' },
                { label: 'Application Reviews', value: 67, color: 'from-purple-500 to-indigo-600', desc: 'Response rate to prospective mentees' },
                { label: 'Goal Completion', value: 74, color: 'from-amber-500 to-orange-600', desc: 'Syllabus milestones achieved' }
              ].map((metric, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-slate-500 truncate">{metric.label}</p>
                    <p className="text-lg font-black text-brand-charcoal">{metric.value}%</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">{metric.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* SECOND ROW: Timeline & Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Student Activity Timeline</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time engagement tracking</p>
            </div>
            <button onClick={() => handleTabChange('mentees')} className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All CRM <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {getRecentActivityTimeline().length > 0 ? (
              getRecentActivityTimeline().map((activity) => {
                let ActIcon = Activity;
                let actBg = 'bg-slate-50';
                let actColor = 'text-slate-500';

                if (activity.type === 'session') { ActIcon = Calendar; actBg = 'bg-amber-50'; actColor = 'text-amber-600'; }
                else if (activity.type === 'goal') { ActIcon = CheckCircle; actBg = 'bg-emerald-50'; actColor = 'text-emerald-600'; }
                else if (activity.type === 'assignment') { ActIcon = ClipboardList; actBg = 'bg-indigo-50'; actColor = 'text-indigo-600'; }
                else if (activity.type === 'journal') { ActIcon = FileText; actBg = 'bg-pink-50'; actColor = 'text-pink-600'; }
                else if (activity.type === 'application') { ActIcon = Users; actBg = 'bg-purple-50'; actColor = 'text-purple-600'; }
                else if (activity.type.startsWith('program')) { ActIcon = SparkleIcon; actBg = 'bg-blue-50'; actColor = 'text-blue-600'; }

                return (
                  <div
                    key={activity.id}
                    onClick={() => handleOpenStudentProfile(activity.studentId)}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 border border-slate-200">
                      {activity.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors break-words">{activity.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{activity.activity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-medium">{formatRelativeTime(activity.timestamp)}</span>
                      <div className={`w-8 h-8 rounded-xl ${actBg} flex items-center justify-center`}>
                        <ActIcon className={actColor} size={14} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Activity className="text-slate-300 mb-2 animate-pulse" size={32} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No student activities recorded</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[520px]">
          <div className="mb-6">
            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">At-Risk Students</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Students needing attention</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {getAtRiskStudents().length > 0 ? (
              getAtRiskStudents().map((risk) => {
                const badgeColor =
                  risk.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                  risk.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-blue-50 text-blue-600 border-blue-100';

                return (
                  <div
                    key={risk.studentId}
                    onClick={() => handleOpenStudentProfile(risk.studentId)}
                    className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">
                        {risk.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{risk.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full ${badgeColor}`}>{risk.priority}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-11">{risk.reason}</p>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <CheckCircle className="text-emerald-400 mb-2 animate-bounce" size={32} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">All students in optimal state</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* THIRD ROW: Calendar & Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 min-h-[420px]">
          <div className="flex-1 flex flex-col border-r border-slate-100 pr-0 md:pr-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Academic Calendar</h4>
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                  {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <ArrowLeft size={14} />
                </button>
                <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (<div key={idx} className="py-1">{d}</div>))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center flex-1">
              {getCalendarDays().map((day, idx) => {
                if (!day) return <div key={idx} className="py-2"></div>;
                const hasEvents = getEventsOnDay(day).length > 0;
                const isSelected = selectedCalendarDate &&
                  day.getDate() === selectedCalendarDate.getDate() &&
                  day.getMonth() === selectedCalendarDate.getMonth() &&
                  day.getFullYear() === selectedCalendarDate.getFullYear();
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedCalendarDate(day)}
                    className={`py-2 text-[10px] rounded-xl flex flex-col items-center justify-between relative transition-all duration-200 hover:bg-indigo-50/40 ${isSelected ? 'bg-indigo-600 text-white font-black' : 'text-slate-700'}`}
                  >
                    <span>{day.getDate()}</span>
                    {hasEvents && (<span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-indigo-600'}`}></span>)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between pl-0 md:pl-2">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {selectedCalendarDate ? selectedCalendarDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' }) : "Schedule"}
                </h4>
                <button onClick={() => handleTabChange('sessions')} className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors">Add Session</button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
                {selectedCalendarDate && getEventsOnDay(selectedCalendarDate).length > 0 ? (
                  getEventsOnDay(selectedCalendarDate).map((evt: any, i) => {
                    const isSession = evt.eventType === 'session';
                    const student = isSession ? (studentProfiles.find((p: any) => p.user_id === evt.studentId) || applications.find((a: any) => a.user_id === evt.studentId)) : null;
                    return (
                      <div
                        key={`calendar-event-${i}`}
                        onClick={() => handleTabChange(isSession ? 'sessions' : 'events')}
                        className="p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/30 border border-slate-100/60 hover:border-indigo-100 transition-all cursor-pointer flex justify-between items-center gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{evt.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{isSession ? `1:1 • ${student?.name || 'Student'}` : `Workshop • ${evt.location}`}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-black text-slate-700">{isSession ? evt.startTime.slice(-5) : evt.time}</p>
                          <span className={`inline-block px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md mt-1 ${isSession ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                            {isSession ? 'Coaching' : 'Event'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10">
                    <CalendarDays className="mx-auto text-slate-300 mb-2 animate-pulse" size={24} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activities scheduled</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="uppercase tracking-wider">Upcoming this week:</span>
              <span className="text-indigo-600 font-black">{sessions.filter((s: any) => s.attendanceStatus === 'pending').length} sessions</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Communication Hub</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reach cohort and broadcast</p>
            </div>
            <button onClick={() => handleTabChange('messaging')} className="p-1.5 hover:bg-slate-50 rounded-full transition-colors relative">
              <MessageSquare className="text-slate-500" size={16} />
              {conversations.some((c: any) => c.unreadCount > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Cohort Rooms</p>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {communities.slice(0, 2).map((community: any) => (
                  <div
                    key={community.id}
                    onClick={() => handleTabChange('messaging')}
                    className="p-2.5 rounded-xl bg-slate-50/60 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer flex justify-between items-center gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{community.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{community.lastMessage || "No messages yet"}</p>
                    </div>
                    {community.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full">{community.unreadCount}</span>
                    )}
                  </div>
                ))}
                {communities.length === 0 && (
                  <div className="text-center py-4 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">No active group channels</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex-1 flex flex-col justify-end">
              <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone size={14} className="text-indigo-600" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Quick Broadcast</p>
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full bg-transparent border-b border-indigo-100/60 pb-1.5 text-xs font-bold outline-none focus:border-indigo-600 transition-all text-slate-800 placeholder:text-slate-400"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                />
                <textarea
                  placeholder="Broadcast announcement message..."
                  className="w-full bg-transparent text-[11px] font-medium outline-none resize-none h-[50px] text-slate-700 placeholder:text-slate-400 text-xs"
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                />
                <button
                  onClick={handleBroadcast}
                  disabled={!broadcastTitle.trim() || !broadcastContent.trim()}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  Send Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOURTH ROW: Analytics & Insights Panel */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Workspace Metrics & Performance</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cohort engagement and completion curves</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-xl self-start md:self-auto">
            {[
              { id: 'growth' as const, label: 'Student Growth' },
              { id: 'sessions' as const, label: 'Session Delivery' },
              { id: 'completions' as const, label: 'Program Success' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedChartTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedChartTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartTab === 'completions' ? (
              <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" name="Completion Rate (%)" />
              </AreaChart>
            ) : selectedChartTab === 'sessions' ? (
              <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorSched" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient><linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="scheduled" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSched)" name="Scheduled Sessions" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" name="Completed Sessions" />
              </AreaChart>
            ) : (
              <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="active" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" name="Active Enrollments" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* FIFTH ROW: AI Mentor Assistant */}
      <div className="bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8">
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">AI Mentor Assistant</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Powered by Gemini Pro</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl mb-6">
            Query your students' portfolios, check on session completions, draft recommendations, or get quick diagnostic reports on at-risk alerts directly using natural language.
          </p>

          <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar mb-6">
            {chatHistory.length === 0 ? (
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                <p className="text-xs text-slate-400 leading-relaxed">Ask anything about your students, programs, sessions, or performance insights.</p>
              </div>
            ) : (
              chatHistory.map((msg: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-white/10 ml-8' : 'bg-indigo-500/20 mr-8 border border-indigo-500/30'}`}>
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask anything about your workspace..."
              className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-xs font-semibold outline-none focus:border-indigo-500 transition-all text-white placeholder:text-slate-400"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiChat()}
            />
            <button
              onClick={handleAiChat}
              disabled={isAiLoading}
              className="px-5 bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex-shrink-0 flex items-center justify-center"
            >
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        <div className="md:w-80 relative z-10 flex flex-col justify-center gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Quick Commands</p>
          {[
            { label: "Analyze my students", prompt: "Give me an exhaustive performance audit of my current active students." },
            { label: "Suggest program enhancements", prompt: "How can I refine my product strategy curriculum for better completion rates?" },
            { label: "Draft a weekly reflection prompt", prompt: "Generate a custom reflection form template for mid-term self-reflection." }
          ].map((cmd, i) => (
            <button
              key={i}
              onClick={() => { setUserInput(cmd.prompt); }}
              className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-medium text-slate-300"
            >
              {cmd.label}
            </button>
          ))}
        </div>

        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};
