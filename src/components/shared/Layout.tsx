import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings,
  Menu,
  X,
  User,
  ClipboardList,
  BookOpen,
  MessageCircle,
  Activity,
  Zap,
  Send,
  Target,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Image as ImageIcon,
  CalendarCheck,
  TrendingUp,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { UserRole } from '../../types';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../NotificationDropdown';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === null) {
        if (width >= 768 && width < 1024) {
          setIsCollapsed(true);
        } else if (width >= 1024) {
          setIsCollapsed(false);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const location = useLocation();

  const [aiEnabled, setAiEnabled] = React.useState(true);
  const { user: authUser } = useAuth();

  React.useEffect(() => {
    if (role !== 'mentor' || !authUser?.id) return;
    profileService.getProfileSettings(authUser.id).then(({ data }) => {
      if (data?.ai_enabled !== undefined) {
        setAiEnabled(data.ai_enabled);
      }
    });
  }, [role, authUser?.id]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.aiEnabled !== undefined) {
        setAiEnabled(detail.aiEnabled);
      }
    };
    window.addEventListener('ai-enabled-changed', handler);
    return () => window.removeEventListener('ai-enabled-changed', handler);
  }, []);

  const navItems = [
    { label: 'Overview', path: '/student', icon: LayoutDashboard, roles: ['student'] },
    { label: 'Programs', path: '/student/programs', icon: BookOpen, roles: ['student'] },
    { label: 'Journal', path: '/student/journal', icon: BookOpen, roles: ['student'] },
    { label: 'Goals', path: '/student/goals', icon: Target, roles: ['student'] },
    { label: 'Tasks', path: '/student/tasks', icon: Activity, roles: ['student'] },
    { label: 'Reviews', path: '/student/reviews', icon: MessageCircle, roles: ['student'] },
    { label: 'Forms', path: '/student/forms', icon: ClipboardList, roles: ['student'] },
    { label: 'Sessions', path: '/student/sessions', icon: Calendar, roles: ['student'] },
    { label: 'Messages', path: '/student/messages', icon: MessageCircle, roles: ['student'] },
    { label: 'Resources', path: '/student/resources', icon: LayoutDashboard, roles: ['student'] },
    { label: 'Events', path: '/student/events', icon: CalendarDays, roles: ['student'] },
    { label: 'Profile', path: '/student/profile', icon: User, roles: ['student'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['student'] },
    { label: 'Overview', path: '/mentor', icon: LayoutDashboard, roles: ['mentor'] },
    { label: 'Messaging', path: '/mentor?tab=messaging', icon: Send, roles: ['mentor'] },
    { label: 'Students', path: '/mentor?tab=mentees', icon: Users, roles: ['mentor'] },
    { label: 'Applications', path: '/mentor?tab=applications', icon: ClipboardList, roles: ['mentor'] },
    { label: 'Sessions', path: '/mentor?tab=sessions', icon: Calendar, roles: ['mentor'] },
    { label: 'Programs', path: '/mentor?tab=programs', icon: BookOpen, roles: ['mentor'] },
    { label: 'Progress', path: '/mentor?tab=program-progress', icon: TrendingUp, roles: ['mentor'] },
    { label: 'Reviews', path: '/mentor?tab=feedback', icon: MessageCircle, roles: ['mentor'] },
    { label: 'Resources', path: '/mentor?tab=resources', icon: LayoutDashboard, roles: ['mentor'] },
    { label: 'Events', path: '/mentor?tab=events', icon: CalendarDays, roles: ['mentor'] },
    { label: 'Analytics', path: '/mentor?tab=analytics', icon: Activity, roles: ['mentor'] },
    { label: 'AI Insights', path: '/mentor?tab=ai', icon: Zap, roles: ['mentor'] },
    { label: 'Gallery', path: '/mentor?tab=gallery', icon: ImageIcon, roles: ['mentor'] },
    { label: 'Bookings', path: '/mentor?tab=bookings', icon: CalendarCheck, roles: ['mentor'] },
    { label: 'Contacts', path: '/mentor?tab=contacts', icon: MessageSquare, roles: ['mentor'] },
    { label: 'Emails', path: '/mentor?tab=emails', icon: Mail, roles: ['mentor'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['mentor'] },
  ].filter(item => item.roles.includes(role))
    .filter(item => !(item.label === 'AI Insights' && !aiEnabled));

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    const currentFull = location.pathname + location.search;
    
    if (path.includes('?')) {
      return currentFull === path;
    }
    
    if (location.pathname === path) {
       if (path === '/mentor') {
          const params = new URLSearchParams(location.search);
          const tab = params.get('tab');
          return !tab || tab === 'overview';
       }
       return location.search === '';
    }

    if (location.pathname.startsWith(path) && path !== '/student' && path !== '/mentor') {
      return true;
    }
    
    return false;
  };

  const isLandingPage = location.pathname === '/' || ['/about', '/programs', '/consultation', '/faq', '/contact', '/gallery'].includes(location.pathname);
  const isMessaging = location.search.includes('tab=messaging') || location.pathname === '/student/messages';

  const renderSidebarLinks = (collapsed: boolean) => {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        <nav className={`transition-all duration-250 ease-in-out ${collapsed ? 'px-0 space-y-[20px]' : 'px-4 space-y-[8px]'}`}>
          <div className="pb-4">
            <div className={`transition-all duration-150 ease-in-out overflow-hidden ${collapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-10 opacity-100 mb-3'}`}>
              <p className="px-[24px] text-[11px] font-bold text-[#A8B3C7] uppercase tracking-[0.16em]">
                MAIN MENU
              </p>
            </div>
            <div className={`transition-all duration-250 ease-in-out ${collapsed ? 'space-y-[20px]' : 'space-y-[8px]'}`}>
              {navItems.map((item) => {
                const active = isActive(item.path);
                const activeClass = active
                  ? (collapsed 
                      ? 'bg-indigo-50/70 border border-indigo-400/30 text-indigo-600 ring-1 ring-indigo-400/10 shadow-sm' 
                      : 'bg-slate-900 text-white shadow-lg shadow-slate-200 border border-transparent')
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent';

                return (
                  <div key={item.path} className="relative group/tooltip flex justify-center w-full">
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center transition-all duration-250 ease-in-out overflow-hidden
                        ${collapsed 
                          ? 'justify-center h-[42px] w-[42px] rounded-[12px] px-0' 
                          : 'h-[50px] w-full px-[20px] rounded-[16px]'}
                        ${activeClass}
                      `}
                    >
                      <item.icon size={20} className="shrink-0 transition-all duration-250" />
                      <span className={`text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap transition-all duration-150 ease-in-out ${
                        collapsed 
                          ? 'opacity-0 max-w-0 overflow-hidden ml-0' 
                          : 'opacity-100 max-w-[200px] ml-4'
                      }`}>
                        {item.label}
                      </span>
                    </Link>

                    {collapsed && (
                      <div className="absolute left-full ml-[12px] top-1/2 -translate-y-1/2 bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-[10px] whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity duration-0 group-hover/tooltip:duration-250 group-hover/tooltip:ease-out z-50 shadow-lg shadow-slate-950/20">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    );
  };

  return (
    <div className={`flex bg-[#FDFDFD] flex-col md:flex-row relative ${isMessaging ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Decorative Background Patterns */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-amber-500/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Mobile Top Bar */}
      {role !== 'visitor' && !isLandingPage && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="md:hidden fixed top-0 left-0 w-full h-16 bg-white border-b border-black/[0.03] z-50 flex items-center justify-between px-6"
        >
           <Link to="/" className="text-sm font-black tracking-tighter text-black uppercase">Mentorino</Link>
           <div className="flex items-center gap-2">
              <button onClick={onLogout} className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors" title="Sign Out" aria-label="Sign out">
                <LogOut size={14} />
              </button>
              <Link to="/settings" aria-label="Settings" className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-black hover:scale-110 transition-transform active:scale-95">
                 {role === 'mentor' ? 'M' : 'S'}
               </Link>
              <button onClick={() => setIsSidebarOpen(true)} className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Open navigation menu">
                <Menu size={16} />
              </button>
           </div>
        </motion.div>
      )}

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && role !== 'visitor' && !isLandingPage && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] md:hidden"
            />

            {/* Sidebar drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-screen w-[280px] bg-white border-r border-slate-100 z-[60] flex flex-col md:hidden shadow-2xl"
            >
              <div className="p-6 flex justify-between items-center h-20 border-b border-slate-50">
                <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 group overflow-hidden">
                  <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">M</span>
                  <span className="font-black text-sm tracking-widest uppercase shrink-0">MENTORINO</span>
                </Link>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full" aria-label="Close navigation menu">
                  <X size={20} />
                </button>
              </div>
              {renderSidebarLinks(false)}
              <div className="p-4 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => { onLogout(); setIsSidebarOpen(false); }}
                  className="flex items-center gap-3 w-full h-[50px] px-[20px] rounded-[16px] text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-250"
                >
                  <LogOut size={20} className="shrink-0" />
                  <span className="text-[15px] font-medium">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sticky Collapsible Sidebar */}
      {role !== 'visitor' && !isLandingPage && (
        <motion.aside
          initial={false}
          animate={{
            width: isMobile ? 0 : (isCollapsed ? 70 : 280),
            opacity: isMobile ? 0 : 1,
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="hidden md:flex flex-col bg-white border-r border-slate-100 h-screen sticky top-0 overflow-hidden shrink-0 z-40"
        >
          {/* Header */}
          <div className={`flex ${isCollapsed ? 'flex-col justify-center px-2 py-3 gap-2.5 h-20' : 'p-6 justify-between h-20'} items-center border-b border-slate-50 transition-all duration-250 ease-in-out`}>
            {!isCollapsed ? (
              <>
                <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 group overflow-hidden">
                  <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">M</span>
                  <span className="font-black text-sm tracking-widest uppercase shrink-0 transition-opacity duration-150">MENTORINO</span>
                </Link>
                <div className="flex items-center gap-1">
                  <NotificationDropdown />
                  <button 
                    onClick={() => {
                      const nextState = !isCollapsed;
                      setIsCollapsed(nextState);
                      localStorage.setItem('sidebar-collapsed', String(nextState));
                    }} 
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 transition-all duration-250">
                <Link to="/" className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform shrink-0">
                  M
                </Link>
                <button 
                  onClick={() => {
                    const nextState = !isCollapsed;
                    setIsCollapsed(nextState);
                    localStorage.setItem('sidebar-collapsed', String(nextState));
                  }} 
                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors flex items-center justify-center"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Nav links */}
          {renderSidebarLinks(isCollapsed)}

          {/* Sign Out */}
          <div className={`p-4 border-t border-slate-100 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <button
              onClick={onLogout}
              className={`flex items-center transition-all duration-250 ease-in-out group ${
                isCollapsed
                  ? 'justify-center h-[42px] w-[42px] rounded-[12px] mx-auto text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                  : 'h-[50px] w-full px-[20px] rounded-[16px] text-slate-500 hover:bg-rose-50 hover:text-rose-600'
              }`}
              title="Sign Out"
            >
              <LogOut size={20} className="shrink-0 transition-all duration-250" />
              <span className={`text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap transition-all duration-150 ease-in-out ${
                isCollapsed
                  ? 'opacity-0 max-w-0 overflow-hidden ml-0'
                  : 'opacity-100 max-w-[200px] ml-4'
              }`}>
                Sign Out
              </span>
            </button>
          </div>
        </motion.aside>
      )}

      {/* Skip to main content link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-xl focus:shadow-xl focus:text-sm focus:font-bold">
        Skip to main content
      </a>

      {/* Main Content */}
      <main id="main-content" className={`flex-1 w-full min-h-screen overflow-y-auto ${
        (role === 'visitor' || isLandingPage) 
          ? 'p-0' 
          : (isMessaging ? 'p-0 pt-16 md:pt-0' : 'px-6 md:pl-12 md:pr-12 pt-24 md:pt-10 pb-24 md:pb-16')
      }`}>
        <div className={`mx-auto ${(role === 'visitor' || isLandingPage) ? '' : (isMessaging ? 'w-full max-w-none h-[calc(100vh-4rem)] lg:h-screen flex flex-col' : 'max-w-7xl')}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;