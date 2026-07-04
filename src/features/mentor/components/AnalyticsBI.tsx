import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Activity, FileSearch, Clock, BookOpen, CalendarDays, CheckCircle2,
  MessageSquare, ThumbsUp, FolderOpen, Ticket, TrendingUp, Percent, Target,
  Search, X, Filter, Download, ChevronDown, ChevronUp, ExternalLink,
  UserPlus, AlertTriangle, Award, BarChart3, LineChart, PieChart,
  Zap, Bell, Clock as ClockIcon, Sunrise, Star, Bookmark,
  TrendingDown, Minus, Loader2, RefreshCw, FileText,
  Calendar, List, Grid, ArrowUpRight, ArrowDownRight,
  Sparkles, Eye, MousePointerClick, Heart, CheckSquare,
  Ban, Repeat, Edit, Flag, Play, Pause, MoreHorizontal,
  GraduationCap, UsersRound, ClipboardList, DollarSign,
  Home, BarChart4,} from 'lucide-react';
import {
  ResponsiveContainer, LineChart as ReLineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RePieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import { useAnalyticsBI } from '../hooks/useAnalyticsBI';
import type {
  DashboardMetrics, StudentHealthRow, KPIDrillDown, BIChartData,
  MentorPerformanceData, ProgramAnalyticsData, StudentPerformanceData,
  ActivityTimelineEntry, AIInsight, FilterPeriod, ReportType,
} from '../hooks/useAnalyticsBI';
import type { User } from '../../../types';

interface AnalyticsBIProps {
  currentUser: User | null;
}

const COLORS = {
  primary: '#4f46e5', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
  info: '#3b82f6', purple: '#8b5cf6', pink: '#ec4899', cyan: '#06b6d4',
  slate: '#64748b',
};
const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

function KPICard({
  label, value, icon, color, trend, subtitle, onClick,
}: {
  label: string; value: string | number; icon: React.ReactNode; color: string; trend?: string; subtitle?: string; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {trend && <p className="text-[9px] font-bold text-slate-400">{trend}</p>}
          {subtitle && <p className="text-[7px] font-medium text-slate-300">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      {onClick && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={14} className="text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
      <div>
        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">{title}</h3>
        {subtitle && <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-600',
    medium: 'bg-amber-50 text-amber-600',
    high: 'bg-rose-50 text-rose-600',
  };
  return <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${styles[level] || styles.low}`}>{level}</span>;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <ArrowUpRight size={14} className="text-emerald-500" />;
  if (trend === 'down') return <ArrowDownRight size={14} className="text-rose-500" />;
  return <Minus size={14} className="text-slate-400" />;
}

function Skeleton({ className = '' }: { className?: string; key?: number | string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />;
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
      {Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">{icon}</div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      {description && <p className="text-[9px] text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

export default function AnalyticsBI({ currentUser }: AnalyticsBIProps) {
  const d = useAnalyticsBI({ currentUser });
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  if (d.loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
        <LoadingCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Business Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Real-time analytics dashboard — all metrics update automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{d.liveOnlineUsers} Online</span>
          </div>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative px-4 py-2.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
            <Bell size={16} className="text-slate-600" />
            {d.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">{d.unreadCount > 9 ? '9+' : d.unreadCount}</span>
            )}
          </button>
          <ExportMenu onExportPDF={d.exportToPDF} onExportCSV={d.exportToCSV} onExportExcel={d.exportToExcel} onGenerateReport={d.generateReport} />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'charts', label: 'Charts' },
          { id: 'students', label: 'Students' },
          { id: 'programs', label: 'Programs' },
          { id: 'performance', label: 'Performance' },
          { id: 'insights', label: 'Insights' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'widgets', label: 'Widgets' },
          { id: 'reports', label: 'Reports' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
              activeSection === s.id ? 'bg-black text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && <OverviewSection d={d} />}
      {activeSection === 'charts' && <ChartsSection d={d} />}
      {activeSection === 'students' && <StudentsSection d={d} />}
      {activeSection === 'programs' && <ProgramsSection d={d} />}
      {activeSection === 'performance' && <PerformanceSection d={d} />}
      {activeSection === 'insights' && <InsightsSection d={d} />}
      {activeSection === 'timeline' && <TimelineSection d={d} />}
      {activeSection === 'widgets' && <WidgetsSection d={d} currentUser={currentUser} />}
      {activeSection === 'reports' && <ReportsSection d={d} />}

      {d.drillDown && <DrillDownModal d={d} />}
      {showNotifications && <NotificationsPanel d={d} onClose={() => setShowNotifications(false)} />}
    </div>
  );
}

function OverviewSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search students, programs, sessions, resources, events, reviews..."
          className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
          value={d.globalSearch}
          onChange={e => d.setGlobalSearch(e.target.value)}
        />
        {d.globalSearch && (
          <button onClick={() => d.setGlobalSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X size={14} className="text-slate-400" />
          </button>
        )}
        <AnimatePresence>
          {d.searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto"
            >
              {d.searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (r.type === 'Student') d.handleOpenStudentProfile(r.id);
                    else if (r.type === 'Program') window.location.hash = `/mentor?tab=programs&id=${r.id}`;
                    else if (r.type === 'Session') window.location.hash = `/mentor?tab=sessions`;
                    else if (r.type === 'Resource') window.location.hash = `/mentor?tab=resources`;
                    else if (r.type === 'Event') window.location.hash = `/mentor?tab=events`;
                    else if (r.type === 'Review') window.location.hash = `/mentor?tab=feedback`;
                    d.setGlobalSearch('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-all border-b border-slate-50 last:border-0"
                >
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 w-16 shrink-0">{r.type}</span>
                  <span className="text-sm font-bold text-slate-800 flex-1 truncate">{r.label}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{r.sub}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FilterBar d={d} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[32px] text-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Platform Health Score</p>
            <p className="text-5xl font-black mt-2">{d.platformHealth.healthScore}%</p>
            <p className="text-xs text-indigo-200 mt-1">{d.platformHealth.active} active · {d.platformHealth.atRisk} at risk · {d.platformHealth.completion}% completion</p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Active', value: `${d.platformHealth.active}`, color: 'bg-emerald-400' },
              { label: 'Completion', value: `${d.platformHealth.completion}%`, color: 'bg-blue-400' },
              { label: 'Attendance', value: `${d.platformHealth.attendance}%`, color: 'bg-amber-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
        <KPICard label="Total Students" value={d.metrics.totalStudents} icon={<Users size={16} className="text-indigo-600" />} color="bg-indigo-50" trend={`${d.activeStudents.length} active`} subtitle="All enrolled students" onClick={() => d.handleDrillDown('students')} />
        <KPICard label="Active Students" value={d.metrics.activeStudents} icon={<Activity size={16} className="text-emerald-600" />} color="bg-emerald-50" trend={`${Math.round((d.metrics.activeStudents / (d.metrics.totalStudents || 1)) * 100)}% of total`} onClick={() => d.handleDrillDown('active')} />
        <KPICard label="New Applications" value={d.metrics.newApplications} icon={<UserPlus size={16} className="text-blue-600" />} color="bg-blue-50" trend="This week" onClick={() => d.handleDrillDown('applications')} />
        <KPICard label="Pending Applications" value={d.metrics.pendingApplications} icon={<Clock size={16} className="text-amber-600" />} color="bg-amber-50" trend="Awaiting review" onClick={() => d.handleDrillDown('pending')} />
        <KPICard label="Active Programs" value={d.metrics.activePrograms} icon={<BookOpen size={16} className="text-purple-600" />} color="bg-purple-50" trend={`${d.programs.length} total`} onClick={() => d.handleDrillDown('programs')} />
        <KPICard label="Upcoming Sessions" value={d.metrics.upcomingSessions} icon={<CalendarDays size={16} className="text-cyan-600" />} color="bg-cyan-50" trend="Next 7 days" onClick={() => d.handleDrillDown('upcoming')} />
        <KPICard label="Completed Sessions" value={d.metrics.completedSessions} icon={<CheckCircle2 size={16} className="text-emerald-600" />} color="bg-emerald-50" trend={`${d.metrics.attendanceRate}% attendance`} onClick={() => d.handleDrillDown('completed')} />
        <KPICard label="Reviews Pending" value={d.metrics.reviewsPending} icon={<MessageSquare size={16} className="text-rose-600" />} color="bg-rose-50" trend="Needs action" onClick={() => d.handleDrillDown('reviewsPending')} />
        <KPICard label="Reviews Completed" value={d.metrics.reviewsCompleted} icon={<ThumbsUp size={16} className="text-emerald-600" />} color="bg-emerald-50" trend={`${d.avgReviewRating}★ avg rating`} onClick={() => d.handleDrillDown('reviewsDone')} />
        <KPICard label="Resources" value={d.metrics.resourcesUploaded} icon={<FolderOpen size={16} className="text-indigo-600" />} color="bg-indigo-50" trend="Total uploaded" onClick={() => d.handleDrillDown('resources')} />
        <KPICard label="Event Registrations" value={d.metrics.eventRegistrations} icon={<Ticket size={16} className="text-pink-600" />} color="bg-pink-50" trend="All time" onClick={() => d.handleDrillDown('events')} />
        <KPICard label="Avg Growth Score" value={d.metrics.growthScoreAverage} icon={<TrendingUp size={16} className="text-blue-600" />} color="bg-blue-50" trend="Across all students" onClick={() => d.handleDrillDown('growth')} />
        <KPICard label="Completion Rate" value={`${d.metrics.studentCompletionRate}%`} icon={<Target size={16} className="text-emerald-600" />} color="bg-emerald-50" trend="Program completion" onClick={() => d.handleDrillDown('completion')} />
        <KPICard label="Attendance Rate" value={`${d.metrics.attendanceRate}%`} icon={<Percent size={16} className="text-amber-600" />} color="bg-amber-50" trend="Session attendance" onClick={() => d.handleDrillDown('attendance')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TodayWidgets d={d} />
        <AIInsightsSummary d={d} />
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <SectionHeader title="Top Performing Students" subtitle="By growth score" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {d.topStudents.map((s, i) => (
            <motion.button
              key={s.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
              onClick={() => d.handleOpenStudentProfile(s.userId)}
              className="text-left p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                  <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider truncate">{s.program}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-black text-indigo-600">{s.growthScore}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">#{i + 1}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <StudentHealthTable d={d} compact />
    </div>
  );
}

function FilterBar({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
        <Filter size={14} /> Filters {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {Object.values(d.filters).some(v => v) && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={d.filters.program} onChange={e => d.setFilters(f => ({ ...f, program: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-black">
            <option value="">All Programs</option>
            {d.programs.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
          </select>
          <select value={d.filters.status} onChange={e => d.setFilters(f => ({ ...f, status: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-black">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
          <select value={d.filters.growthScore} onChange={e => d.setFilters(f => ({ ...f, growthScore: e.target.value }))} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-black">
            <option value="">Growth: Any</option>
            <option value="90">90+</option>
            <option value="75">75+</option>
            <option value="50">50+</option>
            <option value="25">25+</option>
          </select>
          <select value={d.filters.period} onChange={e => d.setFilters(f => ({ ...f, period: e.target.value as FilterPeriod }))} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-black">
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="quarter">Past Quarter</option>
            <option value="year">Past Year</option>
          </select>
          <input
            type="text" placeholder="Search student..."
            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-black"
            value={d.filters.student}
            onChange={e => d.setFilters(f => ({ ...f, student: e.target.value }))}
          />
          <button onClick={() => d.setFilters({ program: '', mentor: '', student: '', status: '', growthScore: '', period: 'all' })} className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 border border-slate-100 rounded-xl">
            Clear All
          </button>
        </motion.div>
      )}
    </div>
  );
}

function ChartsSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  const c = d.chartData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chart Period</p>
        <div className="flex bg-slate-50 p-1 rounded-xl">
          {(['weekly', 'monthly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => d.setChartPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${d.chartPeriod === p ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Student Growth" subtitle="Active students over time" icon={<TrendingUp size={16} />}>
          {c.studentGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={c.studentGrowth}>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#sg)" name="Students" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No growth data yet" />}
        </ChartCard>

        <ChartCard title="Applications" subtitle="Submitted vs accepted vs rejected vs pending" icon={<FileSearch size={16} />}>
          {c.applications.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.applications}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="submitted" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Submitted" />
                <Bar dataKey="accepted" fill="#10b981" radius={[4, 4, 0, 0]} name="Accepted" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No application data yet" />}
        </ChartCard>

        <ChartCard title="Sessions" subtitle="Scheduled vs completed vs cancelled vs missed" icon={<CalendarDays size={16} />}>
          {c.sessions.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.sessions}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="scheduled" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Scheduled" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="cancelled" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cancelled" />
                <Bar dataKey="missed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Missed" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No session data yet" />}
        </ChartCard>

        <ChartCard title="Reviews" subtitle="Pending vs completed vs returned" icon={<MessageSquare size={16} />}>
          {c.reviews.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.reviews}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="returned" fill="#ef4444" radius={[4, 4, 0, 0]} name="Returned" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No review data yet" />}
        </ChartCard>

        <ChartCard title="Programs" subtitle="Enrollment, completion, dropout, active" icon={<BookOpen size={16} />}>
          {c.programs.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.programs}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="enrollment" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Enrollment" />
                <Bar dataKey="completion" fill="#10b981" radius={[4, 4, 0, 0]} name="Completion" />
                <Bar dataKey="dropout" fill="#ef4444" radius={[4, 4, 0, 0]} name="Dropout" />
                <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No program data yet" />}
        </ChartCard>

        <ChartCard title="Events" subtitle="Registrations, attendance, no show" icon={<Ticket size={16} />}>
          {c.events.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.events}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="registrations" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Registrations" />
                <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Attendance" />
                <Bar dataKey="noShow" fill="#ef4444" radius={[4, 4, 0, 0]} name="No Show" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No event data yet" />}
        </ChartCard>

        <ChartCard title="Resources" subtitle="Downloads, views, favorites, completion" icon={<FolderOpen size={16} />}>
          {c.resources.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.resources}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="downloads" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Downloads" />
                <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Views" />
                <Bar dataKey="favorites" fill="#ec4899" radius={[4, 4, 0, 0]} name="Favorites" />
                <Bar dataKey="completion" fill="#10b981" radius={[4, 4, 0, 0]} name="Completion" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No resource data yet" />}
        </ChartCard>

        <ChartCard title="Goals" subtitle="Completed vs pending vs overdue" icon={<Target size={16} />}>
          {c.goals.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.goals}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} name="Overdue" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No goal data yet" />}
        </ChartCard>

        <ChartCard title="Tasks" subtitle="Assigned vs completed vs delayed" icon={<CheckSquare size={16} />}>
          {c.tasks.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={c.tasks}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="assigned" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Assigned" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="delayed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={<BarChart3 size={20} />} title="No task data yet" />}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div>
          <p className="text-xs font-black uppercase tracking-tight text-slate-800">{title}</p>
          {subtitle && <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function StudentsSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  return <StudentHealthTable d={d} />;
}

function StudentHealthTable({ d, compact }: { d: ReturnType<typeof useAnalyticsBI>; compact?: boolean }) {
  const [sortField, setSortField] = useState<string>('growthScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const list = compact ? d.studentHealthRows.slice(0, 10) : d.filteredStudents;
    return [...list].sort((a: any, b: any) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [d.studentHealthRows, d.filteredStudents, compact, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap">
      {children}
      {sortField === field && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
    </button>
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 pb-3">
        <SectionHeader
          title="Student Health Dashboard"
          subtitle={`${sorted.length} students · ${d.studentHealthRows.filter(s => s.riskLevel === 'high').length} at risk`}
          action={
            !compact && <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Search students..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium outline-none focus:border-black w-48"
                  value={d.filters.student}
                  onChange={e => d.setFilters(f => ({ ...f, student: e.target.value }))}
                />
              </div>
            </div>
          }
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3"><SortHeader field="name">Student</SortHeader></th>
              <th className="text-left px-3 py-3"><SortHeader field="program">Program</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="growthScore">Growth</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="completionPercent">Completion</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="attendance">Attend</SortHeader></th>
              <th className="text-left px-3 py-3"><SortHeader field="lastActive">Last Active</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="pendingTasks">Tasks</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="pendingReviews">Reviews</SortHeader></th>
              <th className="text-left px-3 py-3"><SortHeader field="upcomingSession">Next Session</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="riskLevel">Risk</SortHeader></th>
              <th className="text-center px-3 py-3"><SortHeader field="progressTrend">Trend</SortHeader></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <motion.tr
                key={s.userId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: i * 0.02 } }}
                onClick={() => d.handleOpenStudentProfile(s.userId)}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                      <p className="text-[8px] text-slate-400 font-medium truncate">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5"><span className="text-[10px] font-bold text-slate-600">{s.program}</span></td>
                <td className="px-3 py-3.5 text-center"><span className="text-sm font-black text-indigo-600">{s.growthScore}</span></td>
                <td className="px-3 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.completionPercent}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500">{s.completionPercent}%</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-center"><span className={`text-[10px] font-black ${s.attendance >= 75 ? 'text-emerald-600' : s.attendance >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{s.attendance}%</span></td>
                <td className="px-3 py-3.5"><span className="text-[10px] font-medium text-slate-500">{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A'}</span></td>
                <td className="px-3 py-3.5 text-center"><span className="text-[10px] font-bold text-slate-600">{s.pendingTasks}</span></td>
                <td className="px-3 py-3.5 text-center"><span className="text-[10px] font-bold text-slate-600">{s.pendingReviews}</span></td>
                <td className="px-3 py-3.5">
                  <span className="text-[9px] font-medium text-slate-500 truncate max-w-[120px] block" title={s.upcomingSessionDate ? new Date(s.upcomingSessionDate).toLocaleString() : ''}>
                    {s.upcomingSession || '—'}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-center"><RiskBadge level={s.riskLevel} /></td>
                <td className="px-3 py-3.5 text-center"><TrendIcon trend={s.progressTrend} /></td>
              </motion.tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={11} className="text-center py-12"><EmptyState icon={<Users size={20} />} title="No students match the current filters." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgramsSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Program Analytics" subtitle="Detailed metrics per program" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {d.programAnalytics.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-sm font-black uppercase tracking-tight text-slate-900">{p.title}</p>
            <p className="text-[9px] font-medium text-slate-400 mt-1">{p.category}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="Enrollment" value={p.enrollment} />
              <Stat label="Active" value={p.activeStudents} />
              <Stat label="Completion" value={p.completions} />
              <Stat label="Avg Growth" value={p.avgGrowth} />
              <Stat label="Avg Attendance" value={`${p.avgAttendance}%`} />
              <Stat label="Drop Rate" value={`${p.dropRate}%`} color={p.dropRate > 20 ? 'text-rose-600' : 'text-emerald-600'} />
              <Stat label="Reviews" value={p.reviewCount} />
              <Stat label="Sessions" value={p.sessionCount} />
              <Stat label="Resources" value={p.resourceCount} />
              <Stat label="Events" value={p.eventCount} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                <span>Progress</span>
                <span>{p.enrollment > 0 ? Math.round((p.completions / p.enrollment) * 100) : 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${p.enrollment > 0 ? Math.round((p.completions / p.enrollment) * 100) : 0}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-3">
      <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-lg font-black mt-0.5 ${color || 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function PerformanceSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  const mp = d.mentorPerformance;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <SectionHeader title="Your Performance" subtitle="Mentor metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Stat label="Students" value={mp.studentsManaged} />
          <Stat label="Sessions" value={mp.sessionsConducted} />
          <Stat label="Reviews" value={mp.reviewsCompleted} />
          <Stat label="Rating" value={`${mp.averageRating}★`} color="text-amber-500" />
          <Stat label="Response" value={mp.responseTime} />
          <Stat label="Resources" value={mp.resourcesUploaded} />
          <Stat label="Events" value={mp.eventsHosted} />
          <Stat label="Completion" value={`${mp.completionRate}%`} color="text-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <SectionHeader title="Student Leaderboard" subtitle="Top 10 by growth score" />
          <div className="space-y-1">
            {d.studentLeaderboard.map((s, i) => (
              <motion.button
                key={s.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
                onClick={() => d.handleOpenStudentProfile(s.userId)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-2xl transition-all text-left"
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black ${i < 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-black">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                  <p className="text-[8px] text-slate-400 truncate">{s.program}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600">{s.growthScore}</p>
                  <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Score</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <SectionHeader title="Student Performance" subtitle="Activity & engagement scores" />
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {d.studentPerformanceList.slice(0, 20).map((s, i) => (
              <motion.button
                key={s.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.02 } }}
                onClick={() => d.handleOpenStudentProfile(s.userId)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-2xl transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-black">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                  <p className="text-[8px] text-slate-400 truncate">{s.program}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-black text-emerald-600">{s.activityScore}</p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Activity</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-indigo-600">{s.engagementScore}</p>
                    <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Engage</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <SectionHeader title="AI Insights" subtitle="Smart recommendations" />
        <div className="space-y-3">
          {d.aiInsights.map(insight => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${
                insight.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                insight.type === 'trend' ? 'bg-blue-50 border-blue-100' :
                'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {insight.type === 'warning' ? <AlertTriangle size={16} className="text-amber-600 mt-0.5" /> :
                 insight.type === 'success' ? <Award size={16} className="text-emerald-600 mt-0.5" /> :
                 insight.type === 'trend' ? <TrendingUp size={16} className="text-blue-600 mt-0.5" /> :
                 <Zap size={16} className="text-indigo-600 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">{insight.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {d.aiInsights.length === 0 && (
            <EmptyState icon={<Sparkles size={20} />} title="Generating insights from your data..." />
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <SectionHeader title="Recent Notifications" subtitle={`${d.unreadCount} unread`} />
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {d.notifications.slice(0, 20).map(n => (
            <div key={n.id} className={`p-3 rounded-2xl border ${n.read ? 'border-slate-50 bg-white' : 'border-indigo-100 bg-indigo-50/30'}`}>
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-800">{n.title}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[7px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          ))}
          {d.notifications.length === 0 && (
            <EmptyState icon={<Bell size={20} />} title="No notifications yet." />
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  const typeIcons: Record<string, React.ReactNode> = {
    session: <CalendarDays size={12} />,
    application: <FileSearch size={12} />,
    task: <CheckSquare size={12} />,
    goal: <Target size={12} />,
    journal: <FileText size={12} />,
    notification: <Bell size={12} />,
    program: <BookOpen size={12} />,
    resource: <FolderOpen size={12} />,
    event: <Ticket size={12} />,
    review: <MessageSquare size={12} />,
    enrollment: <UserPlus size={12} />,
  };
  const typeColors: Record<string, string> = {
    session: 'bg-blue-100 text-blue-600',
    application: 'bg-purple-100 text-purple-600',
    task: 'bg-amber-100 text-amber-600',
    goal: 'bg-emerald-100 text-emerald-600',
    journal: 'bg-rose-100 text-rose-600',
    notification: 'bg-slate-100 text-slate-600',
    program: 'bg-indigo-100 text-indigo-600',
    resource: 'bg-cyan-100 text-cyan-600',
    event: 'bg-pink-100 text-pink-600',
    review: 'bg-orange-100 text-orange-600',
    enrollment: 'bg-teal-100 text-teal-600',
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <SectionHeader title="Activity Timeline" subtitle="Live activity feed — newest first" />
      <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
        {d.activityTimeline.map((evt, i) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { delay: i * 0.01 } }}
            className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-2xl transition-all"
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${typeColors[evt.type] || 'bg-slate-100 text-slate-600'}`}>
              {typeIcons[evt.type] || <Zap size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800">{evt.title}</p>
              <p className="text-[9px] text-slate-500 truncate">{evt.description}</p>
            </div>
            <span className="text-[8px] text-slate-400 shrink-0">{new Date(evt.timestamp).toLocaleDateString()} {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </motion.div>
        ))}
        {d.activityTimeline.length === 0 && (
          <EmptyState icon={<Activity size={20} />} title="No activity yet." description="Data will appear as students engage." />
        )}
      </div>
    </div>
  );
}

function WidgetsSection({ d, currentUser }: { d: ReturnType<typeof useAnalyticsBI>; currentUser: User | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <WidgetCard title="Today's Activity" icon={<Sunrise size={16} />}>
        <div className="space-y-2">
          <WidgetStat label="Sessions Today" value={d.todayActivity.sessionsToday} />
          <WidgetStat label="Signups Today" value={d.todayActivity.signupsToday} />
          <WidgetStat label="Applications Today" value={d.todayActivity.appsToday} />
          <WidgetStat label="Tasks Completed" value={d.todayActivity.tasksCompleted} />
          <WidgetStat label="Goals Completed" value={d.todayActivity.goalsCompleted} />
        </div>
      </WidgetCard>

      <WidgetCard title="This Week" icon={<Calendar size={16} />}>
        <div className="space-y-2">
          <WidgetStat label="New Students" value={d.thisWeekActivity.newStudents} />
          <WidgetStat label="New Applications" value={d.thisWeekActivity.newApps} />
          <WidgetStat label="Sessions Completed" value={d.thisWeekActivity.sessionsCompleted} />
          <WidgetStat label="Goals Completed" value={d.thisWeekActivity.goalsCompleted} />
        </div>
      </WidgetCard>

      <WidgetCard title="Platform Health" icon={<Activity size={16} />}>
        <div className="flex items-center justify-center py-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={d.platformHealth.healthScore > 70 ? '#10b981' : d.platformHealth.healthScore > 40 ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 42 * d.platformHealth.healthScore / 100} ${2 * Math.PI * 42 * (100 - d.platformHealth.healthScore) / 100}`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-2xl font-black text-slate-900">{d.platformHealth.healthScore}%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-sm font-black text-slate-800">{d.platformHealth.active}</p><p className="text-[7px] font-black uppercase text-slate-400">Active</p></div>
          <div><p className="text-sm font-black text-slate-800">{d.platformHealth.atRisk}</p><p className="text-[7px] font-black uppercase text-slate-400">At Risk</p></div>
          <div><p className="text-sm font-black text-slate-800">{d.platformHealth.completion}%</p><p className="text-[7px] font-black uppercase text-slate-400">Complete</p></div>
        </div>
      </WidgetCard>

      <WidgetCard title="Upcoming Sessions" icon={<CalendarDays size={16} />}>
        <div className="space-y-2">
          {d.upcomingSessionsList.map(s => (
            <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-[9px] font-bold text-slate-700 truncate">{s.title}</span>
              <span className="text-[7px] font-medium text-slate-400 shrink-0">{new Date(s.startTime).toLocaleDateString()}</span>
            </div>
          ))}
          {d.upcomingSessionsList.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400">No upcoming sessions.</p>}
        </div>
      </WidgetCard>

      <WidgetCard title="Today's Events" icon={<Ticket size={16} />}>
        <div className="space-y-2">
          {d.todayEvents.map(e => (
            <div key={e.id} className="p-2 bg-slate-50 rounded-xl">
              <p className="text-[9px] font-bold text-slate-700">{e.title}</p>
              <p className="text-[7px] text-slate-400">{e.time} · {e.location}</p>
            </div>
          ))}
          {d.todayEvents.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400">No events today.</p>}
        </div>
      </WidgetCard>

      <WidgetCard title="Recent Signups" icon={<UserPlus size={16} />}>
        <div className="space-y-2">
          {d.recentSignups.map(s => (
            <div key={s.user_id || s.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[7px] font-black">{(s.name || '?').charAt(0)}</div>
              <span className="text-[9px] font-bold text-slate-700 truncate">{s.name}</span>
            </div>
          ))}
          {d.recentSignups.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400">No recent signups.</p>}
        </div>
      </WidgetCard>

      <WidgetCard title="Recent Completions" icon={<Award size={16} />}>
        <div className="space-y-2">
          {d.recentCompletions.map(g => (
            <div key={g.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-[9px] font-bold text-slate-700 truncate">{g.title}</span>
              <span className="text-[7px] font-medium text-slate-400 shrink-0">{new Date(g.targetDate || g.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {d.recentCompletions.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400">No recent completions.</p>}
        </div>
      </WidgetCard>

      <WidgetCard title="Recent Certificates" icon={<GraduationCap size={16} />}>
        <div className="space-y-2">
          {d.recentCertificates.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-[9px] font-bold text-slate-700 truncate">{c.studentName}</span>
              <span className="text-[7px] font-medium text-slate-400 truncate">{c.programName}</span>
            </div>
          ))}
          {d.recentCertificates.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400">No recent certificates.</p>}
        </div>
      </WidgetCard>

      <WidgetCard title="Students At Risk" icon={<AlertTriangle size={16} />}>
        <div className="space-y-2">
          {d.atRiskStudents.map(s => (
            <button key={s.userId} onClick={() => d.handleOpenStudentProfile(s.userId)} className="w-full flex items-center gap-2 p-2 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all text-left">
              <div className="w-5 h-5 rounded-lg bg-rose-500 flex items-center justify-center text-white text-[7px] font-black">!</div>
              <span className="text-[9px] font-bold text-rose-700 truncate">{s.name}</span>
            </button>
          ))}
          {d.atRiskStudents.length === 0 && <p className="text-center py-4 text-[10px] text-emerald-600 font-bold">No students at risk</p>}
        </div>
      </WidgetCard>

      <WidgetCard title="Quick Actions" icon={<Zap size={16} />}>
        <div className="space-y-2">
          {[
            { label: 'View Applications', href: '/mentor?tab=applications' },
            { label: 'Schedule Session', href: '/mentor?tab=sessions' },
            { label: 'Upload Resource', href: '/mentor?tab=resources' },
            { label: 'Create Event', href: '/mentor?tab=events' },
          ].map((a, i) => (
            <button key={i} onClick={() => window.location.hash = a.href} className="w-full text-left p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-[10px] font-bold text-slate-700">
              {a.label}
            </button>
          ))}
        </div>
      </WidgetCard>

      {(d as any).todayBirthdays?.length > 0 && (
        <WidgetCard title="Upcoming Birthdays" icon={<Star size={16} />}>
          <div className="space-y-2">
            {(d as any).todayBirthdays.slice(0, 5).map((s: any) => (
              <div key={s.user_id || s.id} className="p-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                <p className="text-[9px] font-bold text-slate-700">{s.name}</p>
              </div>
            ))}
          </div>
        </WidgetCard>
      )}
    </div>
  );
}

function WidgetCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

function WidgetStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
      <span className="text-[9px] font-medium text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
  );
}

function TodayWidgets({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  return (
    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <WidgetCard title="Today's Activity" icon={<Sunrise size={16} />}>
        <div className="grid grid-cols-2 gap-2">
          <WidgetStat label="Sessions" value={d.todayActivity.sessionsToday} />
          <WidgetStat label="Signups" value={d.todayActivity.signupsToday} />
          <WidgetStat label="Applications" value={d.todayActivity.appsToday} />
          <WidgetStat label="Tasks Done" value={d.todayActivity.tasksCompleted} />
          <WidgetStat label="Goals Done" value={d.todayActivity.goalsCompleted} />
        </div>
      </WidgetCard>
      <WidgetCard title="This Week Summary" icon={<Calendar size={16} />}>
        <div className="grid grid-cols-2 gap-2">
          <WidgetStat label="New Students" value={d.thisWeekActivity.newStudents} />
          <WidgetStat label="Applications" value={d.thisWeekActivity.newApps} />
          <WidgetStat label="Sessions Done" value={d.thisWeekActivity.sessionsCompleted} />
          <WidgetStat label="Goals Done" value={d.thisWeekActivity.goalsCompleted} />
        </div>
      </WidgetCard>
    </div>
  );
}

function AIInsightsSummary({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-indigo-500" />
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">AI Insights</p>
      </div>
      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
        {d.aiInsights.slice(0, 5).map(insight => (
          <div key={insight.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl">
            {insight.type === 'warning' ? <AlertTriangle size={10} className="text-amber-500 mt-0.5" /> :
             insight.type === 'success' ? <Award size={10} className="text-emerald-500 mt-0.5" /> :
             <TrendingUp size={10} className="text-blue-500 mt-0.5" />}
            <p className="text-[9px] font-medium text-slate-700">{insight.message}</p>
          </div>
        ))}
        {d.aiInsights.length === 0 && <p className="text-center py-4 text-[9px] text-slate-400">Generating insights...</p>}
      </div>
    </div>
  );
}

function ReportsSection({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  const reportTypes: ReportType[] = ['weekly', 'monthly', 'quarterly', 'yearly'];
  const reportIcons: Record<ReportType, React.ReactNode> = {
    weekly: <CalendarDays size={14} />,
    monthly: <Calendar size={14} />,
    quarterly: <BarChart3 size={14} />,
    yearly: <BarChart4 size={14} />,
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Generate Reports" subtitle="Automated report generation" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map(type => (
          <motion.button
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => d.generateReport(type)}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
              {reportIcons[type]}
            </div>
            <p className="text-sm font-black uppercase tracking-tight text-slate-900">{type.charAt(0).toUpperCase() + type.slice(1)} Report</p>
            <p className="text-[8px] font-medium text-slate-400 mt-1">Comprehensive {type} analytics summary</p>
          </motion.button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <SectionHeader title="Export Reports" subtitle="Download filtered data" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {([
            { label: 'Student Report', type: 'students' as const },
            { label: 'Program Report', type: 'programs' as const },
            { label: 'Mentor Report', type: 'mentor' as const },
            { label: 'Review Report', type: 'reviews' as const },
            { label: 'Attendance Report', type: 'attendance' as const },
            { label: 'Resource Report', type: 'resources' as const },
            { label: 'Event Report', type: 'events' as const },
          ]).map(item => (
            <div key={item.type} className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[9px] font-bold text-slate-700 mb-2">{item.label}</p>
              <div className="flex gap-1">
                <button onClick={() => d.exportToPDF(item.type)} className="flex-1 px-2 py-1.5 bg-black text-white rounded-lg text-[7px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all">PDF</button>
                <button onClick={() => d.exportToCSV(item.type)} className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[7px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all">CSV</button>
                <button onClick={() => d.exportToExcel(item.type)} className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[7px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all">XLS</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DrillDownModal({ d }: { d: ReturnType<typeof useAnalyticsBI> }) {
  if (!d.drillDownData) return null;

  const titleMap: Record<KPIDrillDown, string> = {
    students: 'All Students', active: 'Active Students', applications: 'Applications', pending: 'Pending Applications',
    programs: 'Active Programs', upcoming: 'Upcoming Sessions', completed: 'Completed Sessions',
    sessions: 'All Sessions', reviewsPending: 'Pending Reviews', reviewsDone: 'Completed Reviews',
    reviews: 'All Reviews', resources: 'Resources', events: 'Event Registrations',
    growth: 'Growth Score Data', completion: 'High Completion Students', attendance: 'High Attendance Students',
    goals: 'All Goals', tasks: 'All Tasks',
  };

  const data = Array.isArray(d.drillDownData) ? d.drillDownData : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">{titleMap[d.drillDown!] || 'Details'}</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{data.length} records</p>
          </div>
          <button onClick={d.clearDrillDown} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6">
          {d.drillDown === 'upcoming' || d.drillDown === 'completed' || d.drillDown === 'sessions' ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Title</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr></thead>
              <tbody>
                {(data as any[]).map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="px-3 py-3 text-xs font-bold text-slate-800">{item.title}</td>
                    <td className="px-3 py-3 text-[10px] text-slate-600">{item.studentId}</td>
                    <td className="px-3 py-3 text-[10px] text-slate-500">{new Date(item.startTime).toLocaleDateString()}</td>
                    <td className="px-3 py-3"><span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{item.attendanceStatus || item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : d.drillDown === 'students' || d.drillDown === 'active' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(data as any[]).map((s: any) => (
                <button
                  key={s.user_id || s.id}
                  onClick={() => { d.handleOpenStudentProfile(s.user_id || s.id); d.clearDrillDown(); }}
                  className="text-left p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  <p className="text-sm font-bold text-slate-800">{s.name}</p>
                  <p className="text-[8px] text-slate-400 mt-1">{s.email} · {s.status}</p>
                </button>
              ))}
            </div>
          ) : d.drillDown === 'reviewsPending' || d.drillDown === 'reviewsDone' || d.drillDown === 'reviews' ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Title</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Rating</th>
              </tr></thead>
              <tbody>
                {(data as any[]).slice(0, 50).map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="px-3 py-3 text-xs font-bold text-slate-800">{r.title || 'Review'}</td>
                    <td className="px-3 py-3"><span className="text-[8px] font-black uppercase text-slate-500">{r.status}</span></td>
                    <td className="px-3 py-3 text-[10px] text-slate-600">{r.rating || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : d.drillDown === 'goals' ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Title</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-left px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Due</th>
              </tr></thead>
              <tbody>
                {(data as any[]).slice(0, 50).map((g: any) => (
                  <tr key={g.id} className="border-b border-slate-50">
                    <td className="px-3 py-3 text-xs font-bold text-slate-800">{g.title}</td>
                    <td className="px-3 py-3"><span className="text-[8px] font-black uppercase text-slate-500">{g.status}</span></td>
                    <td className="px-3 py-3 text-[10px] text-slate-500">{g.targetDate ? new Date(g.targetDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(data as any[]).slice(0, 50).map((item: any, i: number) => (
                <div key={item.id || i} className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-800">{item.title || item.name || item.full_name || 'Item'}</p>
                  <p className="text-[8px] text-slate-400 mt-1">{(item as any).email || (item as any).description || (item as any).url || (item as any).status || ''}</p>
                </div>
              ))}
            </div>
          )}
          {data.length === 0 && <p className="text-center py-12 text-sm text-slate-400 font-medium">No data available.</p>}
        </div>
      </motion.div>
    </div>
  );
}

function NotificationsPanel({ d, onClose }: { d: ReturnType<typeof useAnalyticsBI>; onClose: () => void }) {
  const recent = d.notifications.slice(0, 15);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <p className="text-sm font-black uppercase tracking-tighter">Notifications</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{d.unreadCount} unread</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-slate-100"><X size={14} /></button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-64px)] p-4 space-y-2">
          {recent.map(n => (
            <div key={n.id} className={`p-3 rounded-2xl border ${n.read ? 'border-slate-50' : 'border-indigo-100 bg-indigo-50/20'}`}>
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-200' : 'bg-indigo-500'}`} />
                <div>
                  <p className="text-[11px] font-bold text-slate-800">{n.title}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[7px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-center py-8 text-xs text-slate-400">No notifications.</p>}
        </div>
      </motion.div>
    </div>
  );
}

function ExportMenu({ onExportPDF, onExportCSV, onExportExcel, onGenerateReport }: {
  onExportPDF: (type: 'students' | 'programs' | 'mentor' | 'reviews' | 'attendance' | 'resources' | 'events') => void;
  onExportCSV: (type: 'students' | 'programs' | 'mentor' | 'reviews' | 'attendance' | 'resources' | 'events') => void;
  onExportExcel: (type: 'students' | 'programs' | 'mentor' | 'reviews' | 'attendance' | 'resources' | 'events') => void;
  onGenerateReport: (type: ReportType) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
        <Download size={14} /> Export
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 w-64 overflow-hidden"
        >
          <div className="p-2 border-b border-slate-50">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-2 py-1">Reports</p>
            {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map(t => (
              <button
                key={t}
                onClick={() => { onGenerateReport(t); setOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} Report
              </button>
            ))}
          </div>
          <div className="p-2 space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-2 py-1">Export Data</p>
            {(['students', 'programs', 'mentor', 'reviews', 'attendance', 'resources', 'events'] as const).map(type => (
              <div key={type} className="flex items-center gap-1 px-2 py-1">
                <span className="text-[8px] font-bold text-slate-500 w-16 truncate">{type}</span>
                <button onClick={() => { onExportPDF(type); setOpen(false); }} className="px-2 py-1 bg-black text-white rounded-lg text-[7px] font-black uppercase tracking-wider hover:bg-slate-800">PDF</button>
                <button onClick={() => { onExportCSV(type); setOpen(false); }} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[7px] font-black uppercase tracking-wider hover:bg-slate-50">CSV</button>
                <button onClick={() => { onExportExcel(type); setOpen(false); }} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[7px] font-black uppercase tracking-wider hover:bg-slate-50">XLS</button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
