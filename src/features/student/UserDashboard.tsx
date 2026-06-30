import React, { useState, useEffect, useCallback } from "react";
import { studentService } from "../../services/studentService";
import { programService } from "../../services/programService";
import { useDatabaseSync } from "../../hooks/useDatabaseSync";
import { studentProgressService } from "../../services/studentProgressService";
import StudentProgramView from "./StudentProgramView";
import { applicationService } from "../../services/applicationService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Briefcase,
  User as UserIcon,
  Calendar,
  Info,
  MessageSquare,
  X,
  Zap,
  Loader2,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import {
  useNavigate,
  Link,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  User,
  Application,
  Booking,
  TaskActivity,
  NetworkEvent,
} from "../../types";
import { useApplications } from "../../hooks/useApplications";
import { useTasks } from "../../hooks/useTasks";
import { useBookings } from "../../hooks/useBookings";
import { useEvents } from "../../hooks/useEvents";
import { useSessions } from "../../hooks/useSessions";
import { useResources } from "../../hooks/useResources";
import { notifyError, notifySuccess } from "../../utils/toast";

import StudentJournal from "./StudentJournal";
import StudentGoals from "./StudentGoals";
import StudentSessions from "./StudentSessions";
import StudentEvents from "./StudentEvents";
import StudentTasks from "./StudentTasks";
import WhatsAppMessaging from "../messaging/WhatsAppMessaging";
import GrowthForm from "./GrowthForm";

interface UserDashboardProps {
  currentUser: User | null;
  onLogout?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamic Data & Local Storage state
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  // Data Hooks
  const {
    applications,
    loading: appsLoading,
    refresh: refreshApps,
  } = useApplications();
  const {
    bookings,
    loading: bookingsLoading,
    refresh: refreshBookings,
  } = useBookings();
  const {
    events,
    loading: eventsLoading,
    attendEvent,
    refresh: refreshEvents,
  } = useEvents();
  const { sessions } = useSessions(currentUser?.id, "student");
  const { resources } = useResources();
  const upcomingSessions = sessions.filter(
    (s) => s.attendanceStatus === "pending",
  );

  const {
    taskActivities,
    loading: tasksLoading,
    refreshUser: refreshUserTasks,
  } = useTasks();

  const refreshProfilesAndPrograms = useCallback(async () => {
    const { data: progData } = await programService.fetchAll();
    if (progData) {
      setPrograms(progData);
    }
    studentService.getAll().then(setStudentProfiles);
    studentProgressService.initCache();
  }, []);

  useEffect(() => {
    refreshApps();
    refreshProfilesAndPrograms();
    if (currentUser?.id) {
      refreshBookings(); // In real app, filter by userId
      refreshEvents();
      refreshUserTasks(currentUser.id);
    }
  }, [currentUser?.id, refreshApps, refreshBookings, refreshEvents, refreshUserTasks, refreshProfilesAndPrograms]);

  // Handle auto-update on Database changes/sync
  useDatabaseSync(
    useCallback(() => {
      refreshApps();
      refreshBookings();
      refreshEvents();
      refreshProfilesAndPrograms();
      if (currentUser?.id) {
        refreshUserTasks(currentUser.id);
      }
    }, [currentUser?.id, refreshApps, refreshBookings, refreshEvents, refreshProfilesAndPrograms, refreshUserTasks])
  );

  // Synchronize dynamic student learning progress changes
  useEffect(() => {
    const handleProgressSync = () => {
      refreshProfilesAndPrograms();
    };
    window.addEventListener('learning-progress-sync', handleProgressSync);
    return () => {
      window.removeEventListener('learning-progress-sync', handleProgressSync);
    };
  }, [refreshProfilesAndPrograms]);

  const application = applications.find(
    (a) => a.user_email === currentUser?.email,
  );
  const isApproved = application?.status === "approved";
  const isOverview =
    location.pathname === "/student" || location.pathname === "/student/";

  if (appsLoading || bookingsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-300" size={40} />
      </div>
    );
  }

  const renderOverview = () => {
    // 1. Get the current student's profile
    const studentProfile = studentProfiles.find(
      (s) => s.user_id === currentUser?.id || s.email === currentUser?.email
    );

    // 2. Compute dynamic task activities / focus
    const incompleteTasks = taskActivities.filter(
      (t) => t.status !== "completed" && t.status !== "approved" && t.status !== "reviewed"
    );
    const priorityMap: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    const sortedFocusTasks = [...incompleteTasks].sort((a, b) => {
      const pA = priorityMap[a.priority || "medium"] || 2;
      const pB = priorityMap[b.priority || "medium"] || 2;
      if (pA !== pB) return pB - pA; // highest priority first
      return new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime(); // nearest due date first
    });
    const todaysFocus = sortedFocusTasks.slice(0, 3);

    // 3. Compute dynamic program enrollment
    const currentProgram = programs.find((p) => p.id === application?.program_id);
    const programName = currentProgram ? currentProgram.title : "Not enrolled in a program.";

    const getMentorName = () => {
      if (isApproved) return "Peter Mannarino";
      return null;
    };
    const mentorName = getMentorName() || "No mentor assigned";

    // 5. Compute real program/milestone progress
    const currentProgId = application?.program_id;
    const progressPercentage = (isApproved && currentProgId && currentUser?.id)
      ? studentProgressService.calculateProgramProgress(currentUser.id, currentProgId)
      : (taskActivities.length > 0 
          ? Math.round((taskActivities.filter(t => t.status === "completed" || t.status === "approved" || t.status === "reviewed").length / taskActivities.length) * 100) 
          : 0);

    const getBlockProgressBar = (pct: number) => {
      const totalBlocks = 10;
      const filledBlocks = Math.round((pct / 100) * totalBlocks);
      const emptyBlocks = totalBlocks - filledBlocks;
      return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
    };

    // 6. Compute dynamic next session
    const formatSessionTime = (isoString: string) => {
      try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
        const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        return `${weekday} • ${time}`;
      } catch (e) {
        return isoString;
      }
    };
    const nextSessionsList = [...upcomingSessions].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const nextSession = nextSessionsList[0];
    const nextSessionDisplay = nextSession 
      ? formatSessionTime(nextSession.startTime) 
      : "No upcoming session.";

    return (
      <div className="space-y-6">
        <div className="bg-brand-charcoal rounded-[32px] sm:rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-brand-charcoal/20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="relative z-10">
            {isApproved ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">
                      Your Trajectory.
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                        Authorized Member Access Active
                      </p>
                    </div>
                  </div>

                  {/* Today's Focus Section */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      Today's Focus
                    </p>
                    {todaysFocus.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-white/80 font-semibold">
                        {todaysFocus.map((task) => (
                          <li key={task.id} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
                            <span>{task.task_title}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-white/40 font-semibold italic">
                        No tasks available.
                      </p>
                    )}
                  </div>

                  {/* 2nd Application Note */}
                  <motion.button
                    onClick={() => navigate('/student/tasks')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-2xl p-4 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Second Application Required</p>
                      <p className="text-[10px] text-white/60 font-semibold leading-relaxed mt-0.5">
                        Complete your profile details for audit review
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-amber-400/60 shrink-0" />
                  </motion.button>
                </div>

                {/* Right Column */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Current Program
                    </p>
                    <p className="text-sm font-bold text-white">
                      {programName}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Mentor
                    </p>
                    <p className="text-sm font-bold text-white">
                      {mentorName}
                    </p>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Progress
                    </p>
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs tracking-tight text-white/80 select-none">
                          {getBlockProgressBar(progressPercentage)}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          className="bg-emerald-400 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Next Session
                    </p>
                    <p className="text-sm font-bold text-white">
                      {nextSessionDisplay}
                    </p>
                  </div>
                </div>
              </div>
            ) : application?.status === "pending" ? (
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-amber-400">
                  Under Review.
                </h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Peter is auditing your application. We'll notify you shortly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                  Start Journey.
                </h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                  You haven't applied for mentorship yet.
                </p>
                <button
                  onClick={() => navigate("/apply")}
                  className="btn-compact bg-indigo-600 text-white hover:bg-indigo-500 mt-4 shadow-lg shadow-indigo-500/20"
                >
                  Apply Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats or Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/sessions")}
            className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-2 cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[40px] -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Calendar size={18} />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transform -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="text-slate-400" size={16} />
              </div>
            </div>

            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 relative z-10">
              Sessions
            </p>
            <p className="text-xl font-black text-brand-charcoal relative z-10">
              {upcomingSessions.length}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/tasks")}
            className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-2 cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[40px] -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <Zap size={18} />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transform -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="text-slate-400" size={16} />
              </div>
            </div>

            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 relative z-10">
              Active Tasks
            </p>
            <p className="text-xl font-black text-brand-charcoal relative z-10">
              {incompleteTasks.length}
            </p>
          </motion.div>
        </div>
      </div>
    );
  };

  const isMessages = location.pathname === "/student/messages";

  return (
    <div
      className={
        isMessages
          ? "w-full h-full flex flex-col animate-in fade-in duration-1000"
          : "w-full max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-1000 px-4 md:px-0"
      }
    >
      {isOverview && (
        <header className="pt-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              {(() => {
                const hours = new Date().getHours();
                if (hours >= 5 && hours < 12) return "Good Morning";
                if (hours >= 12 && hours < 18) return "Good Afternoon";
                return "Good Evening";
              })()}
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-brand-charcoal">
              {currentUser?.name?.split(" ")[0] || "Student"}.
            </h1>
          </div>
        </header>
      )}

      <main
        className={
          isMessages
            ? "flex-1 h-full min-h-0 flex flex-col overflow-hidden"
            : "min-h-[50vh]"
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className={isMessages ? "flex-1 h-full min-h-0 flex flex-col" : ""}
          >
            <Routes>
              <Route path="/" element={renderOverview()} />
              <Route
                path="/programs"
                element={
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-charcoal">
                        Assigned Programs
                      </h3>
                      <button
                        onClick={() => {
                          const browseSection = document.getElementById('browse-curriculums');
                          if (browseSection) {
                            browseSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-[10px] uppercase font-black tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        Browse All paths
                      </button>
                    </div>

                    {/* Assigned Programs Grid */}
                    {(() => {
                      const assignedApps = applications.filter(
                        (a) => (a.user_email === currentUser?.email || a.user_id === currentUser?.id) && a.status === 'approved'
                      );
                      const assignedProgramIds = assignedApps.map(a => a.program_id);
                      const assignedProgs = programs.filter(p => assignedProgramIds.includes(p.id));

                      return (
                        <>
                          {assignedProgs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {assignedProgs.map((prog, index) => {
                                const progress = studentProgressService.calculateProgramProgress(currentUser?.id || "", prog.id);
                                const isCompleted = progress === 100;
                                const status = progress === 100 ? 'completed' : progress === 0 ? 'not_started' : 'active';
                                
                                const colors = [
                                  { bg: "bg-indigo-50", text: "text-indigo-600", bar: "bg-indigo-500", blob: "bg-indigo-500/5", stat: "bg-indigo-500 text-white" },
                                  { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500", blob: "bg-emerald-500/5", stat: "bg-emerald-500 text-white" },
                                  { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500", blob: "bg-amber-500/5", stat: "bg-amber-100 text-amber-700" },
                                  { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500", blob: "bg-rose-500/5", stat: "bg-rose-500 text-white" },
                                  { bg: "bg-cyan-50", text: "text-cyan-600", bar: "bg-cyan-500", blob: "bg-cyan-500/5", stat: "bg-cyan-500 text-white" }
                                ][index % 5];

                                return (
                                  <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    key={prog.id}
                                    className="relative overflow-hidden bg-white p-6 rounded-[32px] border border-slate-100 space-y-4 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group"
                                  >
                                    <div
                                      className={`absolute top-0 right-0 w-32 h-32 ${colors.blob} rounded-bl-[64px] -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-110 pointer-events-none`}
                                    ></div>
                                    <div className="relative z-10 flex justify-between items-start mb-4">
                                      <div
                                        className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center font-black text-xl shadow-sm`}
                                      >
                                        {prog.title.charAt(0)}
                                      </div>
                                      {isCompleted && (
                                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3">
                                          <CheckCircle2 size={14} /> Completed
                                        </div>
                                      )}
                                    </div>
                                    <div className="relative z-10">
                                      <p className="font-bold text-lg text-brand-charcoal">
                                        {prog.title}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 max-w-[80%] leading-relaxed">
                                        {prog.description}
                                      </p>
                                    </div>
                                    <div className="relative z-10 space-y-3 pt-2">
                                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Progress</span>
                                        <span className={`${colors.text}`}>
                                          {progress}%
                                        </span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progress}%` }}
                                          transition={{ duration: 1, ease: "easeOut" }}
                                          className={`h-full ${colors.bar} rounded-full`}
                                        ></motion.div>
                                      </div>
                                    </div>
                                    
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        if (status === 'not_started' && currentUser?.id) {
                                          studentProgressService.startProgram(currentUser.id, prog.id);
                                        }
                                        navigate(`/student/programs/${prog.id}`);
                                      }}
                                      className={`w-full py-3 mt-4 ${
                                        isCompleted 
                                          ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                                          : status === "active" 
                                            ? colors.stat 
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                      } text-[10px] uppercase font-black tracking-widest rounded-full transition-all shadow-sm relative z-10`}
                                    >
                                      {isCompleted 
                                        ? "✓ Review Program" 
                                        : status === "active"
                                          ? "Continue Lesson"
                                          : "Start Lesson"}
                                    </motion.button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[32px] p-8 md:p-12 text-center space-y-6 max-w-xl mx-auto">
                              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                <BookOpen size={28} />
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">
                                  No programs assigned yet
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                                  You are not currently enrolled in any curriculum paths. Explore our industry-leading career blueprints below to launch your learning journey.
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const browseSection = document.getElementById('browse-curriculums');
                                  if (browseSection) {
                                    browseSection.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] uppercase font-black tracking-widest px-8 py-3.5 rounded-full transition-colors shadow-sm"
                              >
                                Browse Programs
                              </button>
                            </div>
                          )}

                          {/* Browse Programs Catalog */}
                          {(() => {
                            const browseProgs = programs.filter(p => !assignedProgramIds.includes(p.id));
                            if (browseProgs.length === 0) return null;

                            return (
                              <div id="browse-curriculums" className="pt-10 space-y-6">
                                <div className="space-y-1">
                                  <h4 className="text-xl font-black text-brand-charcoal uppercase tracking-tight">
                                    Explore Career Paths
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Discover and enroll in advanced, high-impact career blueprints
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {browseProgs.map((prog, index) => {
                                    const colors = [
                                      { bg: "bg-indigo-50", text: "text-indigo-600" },
                                      { bg: "bg-emerald-50", text: "text-emerald-600" },
                                      { bg: "bg-amber-50", text: "text-amber-600" },
                                      { bg: "bg-rose-50", text: "text-rose-600" },
                                      { bg: "bg-cyan-50", text: "text-cyan-600" }
                                    ][index % 5];

                                    return (
                                      <motion.div
                                        whileHover={{ y: -4 }}
                                        key={prog.id}
                                        className="bg-white p-6 rounded-[28px] border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                                      >
                                        <div className="space-y-4">
                                          <div className={`w-10 h-10 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center font-black text-sm`}>
                                            {prog.title.charAt(0)}
                                          </div>
                                          <div className="space-y-1">
                                            <h5 className="font-extrabold text-sm text-slate-800 leading-tight">
                                              {prog.title}
                                            </h5>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                              {prog.duration || "6 Weeks"} • {prog.difficulty || "All Levels"}
                                            </p>
                                            <p className="text-xs text-slate-500 font-semibold leading-relaxed pt-1.5">
                                              {prog.description}
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          onClick={async () => {
                                            if (!currentUser) return;
                                            const response = await applicationService.submitApplication({
                                              user_id: currentUser.id,
                                              user_name: currentUser.name || "Alex Student",
                                              user_email: currentUser.email || "student@example.com",
                                              program_id: prog.id,
                                              role_selected: "student" as any,
                                              full_name: currentUser.name || "Alex Student",
                                              location: "San Francisco",
                                              linkedin_url: "linkedin.com",
                                              goal: "Career Growth",
                                              focus_area: prog.title
                                            });
                                            if (response.data?.id) {
                                              await applicationService.updateStatus(response.data.id, 'approved');
                                              toast.success(`Successfully enrolled in ${prog.title}!`);
                                              refreshApps();
                                              refreshProfilesAndPrograms();
                                            } else {
                                              toast.error("Enrollment failed. Please try again.");
                                            }
                                          }}
                                          className="w-full py-2.5 mt-6 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 text-[9px] uppercase font-black tracking-widest rounded-xl transition-all"
                                        >
                                          Enroll in Path
                                        </button>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </div>
                }
              />
              <Route
                path="/forms"
                element={<GrowthForm />}
              />
              <Route
                path="/programs/:programId" 
                element={<StudentProgramView currentUser={currentUser} />} 
              />
              <Route
                path="/journal"
                element={
                  <StudentJournal
                    studentId={currentUser?.id || "default-user"}
                  />
                }
              />
              <Route
                path="/goals"
                element={
                  <StudentGoals studentId={currentUser?.id || "default-user"} />
                }
              />
              <Route
                path="/tasks"
                element={
                  <StudentTasks studentId={currentUser?.id || "default-user"} isApproved={isApproved} />
                }
              />
              <Route
                path="/sessions"
                element={
                  <StudentSessions
                    studentId={currentUser?.id || "default-user"}
                  />
                }
              />
              <Route
                path="/messages"
                element={
                  <div className="h-full w-full flex-1 min-h-0 flex flex-col">
                    <WhatsAppMessaging
                      role="student"
                      currentUserId={currentUser?.id || "student-1"}
                      currentUserName={currentUser?.name}
                    />
                  </div>
                }
              />
              <Route
                path="/resources"
                element={
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-brand-charcoal">
                      The Vault
                    </h3>
                    {resources.length === 0 ? (
                      <p className="text-slate-400 text-sm font-medium text-center py-12">
                        No resources available yet. Check back later.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {resources.map((res) => {
                          const cat = (res.category || '').toLowerCase();
                          const icon = cat.includes('engineer') || cat.includes('tech') ? Download
                            : cat.includes('product') ? Briefcase
                            : cat.includes('career') || cat.includes('resume') ? CheckCircle2
                            : cat.includes('interview') ? HelpCircle
                            : ExternalLink;
                          const color = cat.includes('engineer') ? 'text-indigo-600'
                            : cat.includes('product') ? 'text-amber-600'
                            : cat.includes('career') || cat.includes('resume') ? 'text-emerald-600'
                            : cat.includes('interview') ? 'text-rose-600'
                            : 'text-slate-600';
                          const bg = cat.includes('engineer') ? 'bg-indigo-50'
                            : cat.includes('product') ? 'bg-amber-50'
                            : cat.includes('career') || cat.includes('resume') ? 'bg-emerald-50'
                            : cat.includes('interview') ? 'bg-rose-50'
                            : 'bg-slate-50';
                          return (
                            <a
                              key={res.id}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white p-6 rounded-[32px] border border-slate-100 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:ring-4 transition-all duration-300 group cursor-pointer"
                            >
                              <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 shadow-sm`}>
                                {React.createElement(icon, {
                                  size: 20,
                                  className: `${color} transition-colors`
                                })}
                              </div>
                              <p className="font-bold text-sm mb-1 text-brand-charcoal group-hover:text-indigo-600 transition-colors">
                                {res.title}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {res.category}
                              </p>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                }
              />
              <Route
                path="/events"
                element={
                  <StudentEvents
                    events={events}
                    loading={eventsLoading}
                    currentUserId={currentUser?.id || ''}
                    onAttend={attendEvent}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md p-4">
          <div className="bg-black text-white p-6 rounded-[32px] shadow-2xl flex items-start gap-4">
            <Info size={18} className="shrink-0 mt-1" />
            <p className="text-[10px] font-black uppercase tracking-widest flex-1">
              {notification}
            </p>
            <button onClick={() => setNotification(null)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
