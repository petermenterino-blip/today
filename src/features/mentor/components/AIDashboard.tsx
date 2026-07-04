import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Sparkles, Send, Loader2, RotateCcw, Square, Bookmark,
  Trash, Pencil, Search, Pin, PinOff, X, MessageSquare, Clock,
  Users, Calendar, FileSearch, AlertTriangle, TrendingUp, CheckCircle2,
  ChevronDown, ChevronUp, Download, Star, BarChart3, Activity,
  Brain, Lightbulb, Target, Zap, UserCheck,
} from 'lucide-react';
import { contextEngine } from '../../../services/contextEngine';
import type { AIChatMessage } from '../../../types';

interface AIDashboardProps {
  chatHistory: AIChatMessage[];
  setChatHistory: (h: AIChatMessage[]) => void;
  userInput: string;
  setUserInput: (v: string) => void;
  isAiLoading: boolean;
  streamingContent: string;
  chatEndRef: React.RefObject<HTMLDivElement>;
  isGeneratingOverview: boolean;
  aiOverviewText: string;
  insights: { id: string; type: string; message: string; priority: string; timestamp: Date; actionLabel?: string; actionId?: string }[];
  isGeneratingInsights: boolean;
  savedConversations: { id: string; title: string; messages: AIChatMessage[]; updatedAt: Date }[];
  pinnedConversationIds: string[];
  suggestedPrompts: { label: string; prompt: string }[];
  recommendationsResult: { title: string; type: string; description: string }[];
  handleAiChat: () => void;
  handleQuickAction: (prompt: string) => void;
  fetchAiInsights: () => void;
  generateAiOverview: () => void;
  stopGeneration: () => void;
  saveConversation: (title?: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  loadConversation: (id: string) => void;
  togglePinned: (id: string) => void;
  clearChat: () => void;
  searchConversations: (query: string) => { id: string; title: string; messages: AIChatMessage[]; updatedAt: Date }[];
  studentProfiles: any[];
  sessions: any[];
  applications: any[];
  programs: any[];
  userId?: string;
}

export default function AIDashboard({
  chatHistory, userInput, setUserInput, isAiLoading, streamingContent, chatEndRef,
  insights, isGeneratingInsights, savedConversations, pinnedConversationIds,
  suggestedPrompts, recommendationsResult,
  handleAiChat, handleQuickAction, fetchAiInsights, stopGeneration,
  saveConversation, deleteConversation, renameConversation, loadConversation, togglePinned,
  clearChat, searchConversations, isGeneratingOverview, aiOverviewText, generateAiOverview,
  studentProfiles, sessions, applications, programs, userId,
}: AIDashboardProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [convSearch, setConvSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  const filteredConversations = useMemo(() => {
    if (!convSearch.trim()) return savedConversations;
    const lower = convSearch.toLowerCase();
    return savedConversations.filter(c =>
      c.title.toLowerCase().includes(lower) ||
      c.messages.some(m => m.content.toLowerCase().includes(lower))
    );
  }, [savedConversations, convSearch]);

  const pinnedConversations = useMemo(() =>
    filteredConversations.filter(c => pinnedConversationIds.includes(c.id)),
    [filteredConversations, pinnedConversationIds]
  );
  const unpinnedConversations = useMemo(() =>
    filteredConversations.filter(c => !pinnedConversationIds.includes(c.id)),
    [filteredConversations, pinnedConversationIds]
  );

  const sortedConversations = useMemo(() =>
    [...pinnedConversations, ...unpinnedConversations],
    [pinnedConversations, unpinnedConversations]
  );

  const kpiCards = useMemo(() => [
    { icon: Users, label: 'Students Analyzed', value: studentProfiles.length, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { icon: Calendar, label: 'Sessions Analyzed', value: sessions.length, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { icon: FileSearch, label: 'Applications Analyzed', value: applications.filter(a => a.status === 'pending').length, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', textColor: 'text-amber-600' },
    { icon: BarChart3, label: 'Programs Monitored', value: programs.length, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', textColor: 'text-purple-600' },
  ], [studentProfiles, sessions, applications, programs]);

  const quickActions = useMemo(() => [
    { icon: UserCheck, label: 'Students at Risk', onClick: () => handleQuickAction('Which students are at risk right now? Show me who needs immediate attention.') },
    { icon: Calendar, label: 'Today\'s Schedule', onClick: () => handleQuickAction('What is my schedule for today?') },
    { icon: Target, label: 'Pending Reviews', onClick: () => handleQuickAction('What reviews are pending and need my attention?') },
    { icon: Zap, label: 'Session Ideas', onClick: () => handleQuickAction('What sessions should I schedule next based on current data?') },
  ], [handleQuickAction]);

  const [insightFilter, setInsightFilter] = useState<string>('all');
  const filteredInsights = useMemo(() => {
    if (insightFilter === 'all') return insights;
    return insights.filter(i => i.type === insightFilter);
  }, [insights, insightFilter]);

  const execInsightAction = (actionId?: string) => {
    if (!actionId) return;
  };

  const renderMessage = (content: string) => {
    // Simple markdown-like rendering for chat
    const rendered = content
      .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold text-slate-900 mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-black text-slate-900 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-black text-slate-900 mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono my-2 overflow-x-auto"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="text-xs text-slate-700 ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="text-xs text-slate-700 ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/\[Action: (\w+)\](.*?)(?:\n|$)/g, '<button class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700 transition-all mt-1 mr-2" onclick="window.__aiAction && window.__aiAction(\'$1\')">$2</button>');
    return rendered;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel — Conversation History */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-[280px] shrink-0 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">History</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-slate-200 border border-transparent focus:border transition-all"
                  value={convSearch}
                  onChange={e => setConvSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {chatHistory.length > 0 && (
                <button
                  onClick={clearChat}
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl hover:bg-slate-50 text-left group transition-colors"
                >
                  <MessageSquare size={16} className="text-slate-700 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Current Chat</p>
                    <p className="text-[10px] text-slate-400 truncate">{chatHistory.length} messages</p>
                  </div>
                  <X size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              {sortedConversations.length === 0 && !convSearch && (
                <div className="p-6 text-center">
                  <MessageSquare size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No conversations yet</p>
                  <p className="text-[10px] text-slate-300 mt-1">Ask a question to get started.</p>
                </div>
              )}
              {sortedConversations.length === 0 && convSearch && (
                <p className="text-center py-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No results found.</p>
              )}
              {sortedConversations.map(conv => (
                <div
                  key={conv.id}
                  className="group relative flex items-center gap-2.5 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${pinnedConversationIds.includes(conv.id) ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    {pinnedConversationIds.includes(conv.id)
                      ? <Pin size={12} className="text-amber-600" />
                      : <MessageSquare size={12} className="text-slate-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{conv.title}</p>
                    <p className="text-[10px] text-slate-400">{conv.updatedAt.toLocaleDateString()}</p>
                  </div>
                  <div className="hidden group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 bg-white pl-2">
                    <button onClick={e => { e.stopPropagation(); togglePinned(conv.id); }} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
                      {pinnedConversationIds.includes(conv.id) ? <PinOff size={11} className="text-slate-400" /> : <Pin size={11} className="text-slate-400" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setRenamingId(conv.id); setRenameTitle(conv.title); }} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors">
                      <Pencil size={11} className="text-slate-400" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors">
                      <Trash size={11} className="text-red-400" />
                    </button>
                  </div>
                  {renamingId === conv.id && (
                    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex items-center px-2" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        className="flex-1 px-2 py-1.5 bg-slate-50 rounded-xl text-xs font-bold outline-none"
                        value={renameTitle}
                        onChange={e => setRenameTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && renameTitle.trim()) {
                            renameConversation(conv.id, renameTitle.trim());
                            setRenamingId(null);
                          }
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => setRenamingId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Panel — Chat */}
      <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button onClick={() => setShowSidebar(true)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <MessageSquare size={16} className="text-slate-500" />
              </button>
            )}
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Mentorino AI</h2>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Powered by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={chatHistory.length === 0}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-30"
              title="Save conversation"
            >
              <Bookmark size={14} className="text-slate-500" />
            </button>
            <button
              onClick={clearChat}
              disabled={chatHistory.length === 0}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-30"
              title="Clear chat"
            >
              <Trash size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {chatHistory.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-200 mb-4">
                <Sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">AI Insights Workspace</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-8">
                Ask anything about your students, programs, sessions, or platform analytics. The AI has full access to all platform data.
              </p>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {suggestedPrompts.slice(0, 8).map((sp, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(sp.prompt)}
                    className="text-left px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-slate-200 transition-all group"
                  >
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors line-clamp-2">{sp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-4 rounded-[24px] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-[4px]'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-[4px]'
                }`}
                dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
              />
            </div>
          ))}

          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 bg-indigo-50 border border-indigo-100 rounded-[24px] rounded-bl-[4px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">AI is thinking</span>
                </div>
                <div
                  className="text-sm text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMessage(streamingContent) }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-3 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="inline-block w-1.5 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="inline-block w-1.5 h-3 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask anything about your platform..."
              className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-slate-300 focus:bg-white transition-all"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !isAiLoading && userInput.trim()) handleAiChat(); }}
            />
            <div className="flex gap-2">
              {isAiLoading && (
                <button
                  onClick={stopGeneration}
                  className="px-5 py-3.5 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                  title="Stop generation"
                >
                  <Square size={16} />
                </button>
              )}
              <button
                onClick={handleAiChat}
                disabled={isAiLoading || !userInput.trim()}
                className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-40 shadow-lg shadow-slate-200"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Insights, Suggestions, etc */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2">
              {kpiCards.map((kpi, i) => (
                <div key={i} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.bg} mb-2`}>
                    <kpi.icon size={14} className={kpi.textColor} />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((qa, i) => (
                  <button
                    key={i}
                    onClick={qa.onClick}
                    className="flex items-center gap-2 px-3 py-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left group"
                  >
                    <qa.icon size={14} className="text-slate-500 group-hover:text-slate-700 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 leading-tight">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Prompts */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Suggested Prompts</h4>
              </div>
              <div className="space-y-1.5">
                {suggestedPrompts.slice(0, 6).map((sp, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(sp.prompt)}
                    className="w-full text-left px-3 py-2.5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group"
                  >
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 line-clamp-1">{sp.label}</span>
                    <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{sp.prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Insights Feed */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Insights Feed</h4>
                <button
                  onClick={fetchAiInsights}
                  disabled={isGeneratingInsights}
                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  Refresh
                </button>
              </div>
              {isGeneratingInsights ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-300" />
                </div>
              ) : filteredInsights.length === 0 ? (
                <div className="p-4 text-center">
                  <Lightbulb size={20} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No insights yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {filteredInsights.map(insight => (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-2xl border ${
                        insight.type === 'warning' ? 'bg-red-50 border-red-100' :
                        insight.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                        insight.type === 'trend' ? 'bg-blue-50 border-blue-100' :
                        'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {insight.type === 'warning' ? <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" /> :
                         insight.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" /> :
                         insight.type === 'trend' ? <TrendingUp size={14} className="text-blue-500 mt-0.5 shrink-0" /> :
                         <Lightbulb size={14} className="text-slate-500 mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{insight.message}</p>
                          {insight.actionLabel && (
                            <button
                              onClick={() => execInsightAction(insight.actionId)}
                              className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              {insight.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle right panel */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle buttons when panels hidden */}
      {!showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 shadow-lg rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all z-10"
        >
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      )}

      {/* Save Conversation Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl"
            >
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Save Conversation</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Give it a name to find it later</p>
              <input
                autoFocus
                type="text"
                placeholder="Conversation title..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-slate-300 focus:bg-white transition-all mb-5"
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { saveConversation(saveTitle.trim() || undefined); setShowSaveDialog(false); setSaveTitle(''); } }}
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowSaveDialog(false); setSaveTitle(''); }} className="flex-1 py-3.5 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button
                  onClick={() => { saveConversation(saveTitle.trim() || undefined); setShowSaveDialog(false); setSaveTitle(''); }}
                  className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
