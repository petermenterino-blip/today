import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Zap,
  Terminal,
  Play
} from 'lucide-react';

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  stage: 'CLICK' | 'MENU_ANIMATION' | 'SCROLL' | 'MONITOR' | 'SYSTEM';
  message: string;
  data?: any;
}

// Global logger helper
export const logNavEvent = (
  type: 'info' | 'success' | 'warn' | 'error',
  stage: 'CLICK' | 'MENU_ANIMATION' | 'SCROLL' | 'MONITOR' | 'SYSTEM',
  message: string,
  data?: any
) => {
  const event = new CustomEvent('nav-diagnostic-log', {
    detail: {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString() + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
      type,
      stage,
      message,
      data
    }
  });
  window.dispatchEvent(event);
};

export const triggerScrollMonitor = (targetId: string, expectedY: number) => {
  const event = new CustomEvent('start-nav-scroll-monitor', {
    detail: { targetId, expectedY }
  });
  window.dispatchEvent(event);
};

export const NavigationDiagnostics: React.FC = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [scrollMethod, setScrollMethod] = useState<'scrollTo' | 'scrollIntoView'>('scrollIntoView');
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentScrollY, setCurrentScrollY] = useState(window.scrollY);
  const [scrollHeight, setScrollHeight] = useState(document.documentElement.scrollHeight);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync scroll positions live
  useEffect(() => {
    const handleScroll = () => {
      setCurrentScrollY(window.scrollY);
      setScrollHeight(document.documentElement.scrollHeight);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for custom log events
  useEffect(() => {
    const handleLogEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DiagnosticLog>;
      if (customEvent.detail) {
        setLogs(prev => [...prev, customEvent.detail]);
      }
    };
    window.addEventListener('nav-diagnostic-log', handleLogEvent);
    
    // Add initial system log
    logNavEvent(
      'info', 
      'SYSTEM', 
      'Navigation Diagnostics Utility initialized. Ready to capture scroll lifecycle events.',
      { 
        initialScrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        userAgent: navigator.userAgent
      }
    );

    return () => {
      window.removeEventListener('nav-diagnostic-log', handleLogEvent);
    };
  }, []);

  // Live scroll monitoring for resets
  useEffect(() => {
    let monitorTimeout: NodeJS.Timeout;
    let isMonitoring = false;
    let expectedTargetY = 0;
    
    const handleScrollForMonitor = () => {
      if (!isMonitoring) return;
      const currentY = window.scrollY;
      logNavEvent('info', 'MONITOR', `Scroll position changed: ${currentY}px`, {
        scrollY: currentY,
        documentHeight: document.documentElement.scrollHeight,
        expectedTargetY
      });
      
      // If we see it jump back to 0 or near 0, flag as reset
      if (currentY === 0 && expectedTargetY > 50) {
        logNavEvent('error', 'MONITOR', 'CRITICAL SCROLL RESET DETECTED! Viewport was reset to 0px.', {
          details: 'A scroll reset typically occurs due to react-router page scroll restoration, custom useEffects calling window.scrollTo(0, 0), or layout reflows during animation close.',
          probableCauses: [
            'react-router ScrollToTop component triggering on path changes',
            'Framer Motion exit animation unmounting components causing a height collapse to 0',
            'Browser-native scrollRestoration being set to auto instead of manual'
          ]
        });
      }
    };

    const handleStartMonitor = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetId: string, expectedY: number }>;
      expectedTargetY = customEvent.detail?.expectedY || 0;
      isMonitoring = true;
      
      logNavEvent('info', 'MONITOR', `Scroll Monitor Active for target: #${customEvent.detail?.targetId || 'unknown'}. Watching scroll stream...`, {
        expectedY: expectedTargetY,
        currentY: window.scrollY
      });

      window.addEventListener('scroll', handleScrollForMonitor);
      
      if (monitorTimeout) clearTimeout(monitorTimeout);
      monitorTimeout = setTimeout(() => {
        isMonitoring = false;
        window.removeEventListener('scroll', handleScrollForMonitor);
        logNavEvent('success', 'MONITOR', 'Scroll Monitor Session Deactivated after timeout.');
      }, 4000);
    };

    window.addEventListener('start-nav-scroll-monitor', handleStartMonitor);
    return () => {
      window.removeEventListener('start-nav-scroll-monitor', handleStartMonitor);
      window.removeEventListener('scroll', handleScrollForMonitor);
      if (monitorTimeout) clearTimeout(monitorTimeout);
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
    logNavEvent('info', 'SYSTEM', 'Logs cleared.');
  };

  const copyToClipboard = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.stage}] [${l.type.toUpperCase()}] ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    logNavEvent('success', 'SYSTEM', 'Copied diagnostic logs to clipboard!');
  };

  // Export scroll config
  useEffect(() => {
    (window as any).__diagnosticScrollMethod = scrollMethod;
  }, [scrollMethod]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9999] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-500/30 transition-all duration-300 hover:scale-105"
        id="diagnostic-toggle-btn"
      >
        <Activity size={12} className="animate-pulse text-indigo-200" />
        Diagnostics Console
      </button>
    );
  }

  return (
    <div 
      className={`fixed left-6 z-[9999] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-300 ${
        isMinimized 
          ? 'bottom-6 w-80 h-14' 
          : 'bottom-6 w-96 md:w-[480px] h-[400px] md:h-[480px]'
      }`}
      id="diagnostic-console-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-slate-900 bg-slate-950 rounded-t-3xl">
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">Nav Diagnostic Console</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
            title="Close Console"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Status Bar / Configurations */}
          <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-slate-900 bg-slate-950/50 text-[10px] font-mono text-slate-400">
            <div>
              <p className="flex items-center gap-1.5">
                <span className="text-slate-500">Y-POS:</span> 
                <span className="text-indigo-400 font-bold">{currentScrollY}px</span>
              </p>
              <p className="flex items-center gap-1.5 mt-1">
                <span className="text-slate-500">HEIGHT:</span> 
                <span className="text-slate-300">{scrollHeight}px</span>
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 justify-end">
                <span className="text-slate-500">SCROLL VIA:</span>
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-[9px]">scrollIntoView (Direct)</span>
              </p>
              <p className="flex items-center gap-1.5 justify-end mt-1">
                <span className="text-slate-500">AUTO-SCROLL:</span>
                <input 
                  type="checkbox" 
                  checked={autoScroll} 
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-600 h-3 w-3"
                />
              </p>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/80 font-mono text-[10px] leading-relaxed no-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                <Activity size={24} className="opacity-30 animate-pulse" />
                <p>No lifecycle events captured yet.</p>
                <p className="text-[9px]">Click a mobile menu item to trigger logs.</p>
              </div>
            ) : (
              logs.map((log) => {
                let badgeColor = 'bg-slate-900 text-slate-400 border-slate-800';
                let textColor = 'text-slate-300';
                let Icon = Info;

                if (log.type === 'success') {
                  badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
                  textColor = 'text-emerald-200';
                  Icon = CheckCircle;
                } else if (log.type === 'warn') {
                  badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-900/30';
                  textColor = 'text-amber-200';
                  Icon = AlertTriangle;
                } else if (log.type === 'error') {
                  badgeColor = 'bg-rose-950/40 text-rose-400 border-rose-900/30';
                  textColor = 'text-rose-200';
                  Icon = X;
                }

                return (
                  <div 
                    key={log.id} 
                    className="p-2.5 bg-slate-900/40 border border-slate-900/60 rounded-xl space-y-1 hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon size={10} className={textColor} />
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase ${badgeColor}`}>
                          {log.stage}
                        </span>
                        <span className="text-slate-500 text-[9px]">{log.timestamp}</span>
                      </div>
                    </div>
                    <p className={`text-xs ${textColor}`}>{log.message}</p>
                    {log.data && (
                      <pre className="mt-1 p-1.5 bg-black/40 border border-slate-900 rounded text-[9px] text-slate-500 overflow-x-auto max-h-24">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between px-5 h-14 border-t border-slate-900 bg-slate-950 rounded-b-3xl">
            <button 
              onClick={() => {
                logNavEvent('info', 'CLICK', 'Simulated Click Event', { 
                  sectionId: 'programs',
                  timestamp: Date.now()
                });
                setTimeout(() => {
                  logNavEvent('info', 'MENU_ANIMATION', 'Menu exit animation started', { delay: 400 });
                }, 100);
                setTimeout(() => {
                  logNavEvent('success', 'MENU_ANIMATION', 'Menu exit animation completed');
                }, 500);
                setTimeout(() => {
                  logNavEvent('success', 'SCROLL', 'scrollIntoView executed successfully (simulation)', {
                    targetId: 'programs',
                    y: 1200,
                    behavior: 'smooth'
                  });
                }, 550);
              }}
              className="px-3 py-1.5 bg-indigo-950 text-indigo-400 border border-indigo-900/50 hover:bg-indigo-900 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all"
            >
              Simulate Lifecycle
            </button>
            <div className="flex gap-2">
              <button 
                onClick={clearLogs}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-all"
                title="Clear Logs"
              >
                <Trash2 size={13} />
              </button>
              <button 
                onClick={copyToClipboard}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-xl transition-all"
                title="Copy Logs"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
