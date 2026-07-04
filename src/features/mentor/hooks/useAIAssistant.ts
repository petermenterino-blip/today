import { useState, useEffect, useCallback, useRef } from 'react';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { AIChatMessage, StudentProfile, Application, Session, Program } from '../../../types';
import { contextEngine } from '../../../services/contextEngine';
import { chatWithContext, getStudentAnalysis, getProgramAnalysis, analyzeApplication, generateWeeklyReport, generateInsights } from '../../../services/aiAssistant';

interface UseAIAssistantProps {
  studentProfiles: StudentProfile[];
  sessions: Session[];
  applications: Application[];
  programs: Program[];
  userId?: string;
}

interface AiInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'trend';
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  actionLabel?: string;
  actionId?: string;
}

export function useAIAssistant({ studentProfiles, sessions, applications, programs, userId }: UseAIAssistantProps) {
  const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
  const [aiOverviewText, setAiOverviewText] = useState('');
  const [isAnalyzingApps, setIsAnalyzingApps] = useState(false);
  const [appsAnalysisResult, setAppsAnalysisResult] = useState<{
    qualified: { name: string; email: string; reason: string }[];
    needsReview: { name: string; email: string; reason: string }[];
    rejected: { name: string; email: string; reason: string }[];
  } | null>(null);
  const [isGeneratingSessionIntel, setIsGeneratingSessionIntel] = useState(false);
  const [sessionIntelResult, setSessionIntelResult] = useState<{
    commonTopics: string[];
    askedQuestions: string[];
    rating: number;
    ratingReason: string;
  } | null>(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [recommendationsResult, setRecommendationsResult] = useState<{
    title: string;
    type: string;
    description: string;
  }[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportNarrative, setReportNarrative] = useState('');
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [savedConversations, setSavedConversations] = useState<{ id: string; title: string; messages: AIChatMessage[]; updatedAt: Date }[]>([]);
  const [pinnedConversationIds, setPinnedConversationIds] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('mentorino_conversations');
    const pinned = localStorage.getItem('mentorino_pinned_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedConversations(parsed.map((c: any) => ({ ...c, updatedAt: new Date(c.updatedAt) })));
      } catch {}
    }
    if (pinned) {
      try { setPinnedConversationIds(JSON.parse(pinned)); } catch {}
    }
  }, []);

  const persistConversations = useCallback((convs: typeof savedConversations) => {
    localStorage.setItem('mentorino_conversations', JSON.stringify(convs));
  }, []);

  const handleAiChat = async () => {
    if (!userInput.trim() || !userId) return;
    const userMsg: AIChatMessage = { role: 'user', content: userInput };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setIsAiLoading(true);
    setStreamingContent('');
    const input = userInput;
    setUserInput('');

    try {
      let accumulated = '';
      const response = await chatWithContext(
        updatedHistory,
        userId,
        (token: string) => {
          accumulated += token;
          setStreamingContent(accumulated);
        },
      );
      const finalContent = response || 'Analysis unavailable.';
      setChatHistory(prev => [...prev, userMsg, { role: 'model', content: finalContent }]);
      setStreamingContent('');
      scrollToBottom();
    } catch (err: any) {
      notifyError(err.message || 'AI request failed. Please try again.');
      setStreamingContent('');
      setChatHistory(prev => [...prev, userMsg, { role: 'model', content: `I encountered an error: ${err.message || 'Unable to process your request.'}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (!userId) return;
    setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);
    setIsAiLoading(true);
    setStreamingContent('');

    try {
      let accumulated = '';
      const response = await chatWithContext(
        [...chatHistory, { role: 'user', content: prompt }],
        userId,
        (token: string) => {
          accumulated += token;
          setStreamingContent(accumulated);
        },
      );
      const finalContent = response || 'Analysis unavailable.';
      setChatHistory(prev => [...prev, { role: 'model', content: finalContent }]);
      setStreamingContent('');
    } catch (err: any) {
      notifyError(err.message || 'AI request failed.');
      setStreamingContent('');
    } finally {
      setIsAiLoading(false);
    }
  };

  const stopGeneration = useCallback(() => {
    setIsAiLoading(false);
    if (streamingContent) {
      setChatHistory(prev => [...prev, { role: 'model', content: streamingContent }]);
      setStreamingContent('');
    }
  }, [streamingContent]);

  const fetchWorkspaceSummary = useCallback(async () => {
    if (!userId) return;
    setIsGeneratingOverview(true);
    try {
      const context = await contextEngine.getFullContext(userId);
      const activeStudents = studentProfiles.filter(p => p.status === 'active');
      const atRisk = studentProfiles.filter(p => p.healthStatus === 'at_risk' || p.status === 'at_risk').length;
      const totalProgress = studentProfiles.reduce((acc, s) => acc + (s.goal_progress || 0), 0);
      const avgProgress = studentProfiles.length > 0 ? Math.round(totalProgress / studentProfiles.length) : 0;
      const sessionsThisWeek = context.sessions?.filter((s: any) => {
        const d = new Date(s.scheduled_at || s.startTime);
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return d >= now && d <= nextWeek;
      }).length || 0;
      const summary = `## Workspace Overview\n\n**${activeStudents.length}** active students, **${programs.length}** programs, **${sessionsThisWeek}** sessions this week, **${applications.filter(a => a.status === 'pending').length}** pending applications, **${atRisk}** students at risk, **${avgProgress}%** average progress.`;
      setAiOverviewText(summary);
    } catch (err) {
      console.error('Error generating workspace summary:', err);
      setAiOverviewText('Unable to load workspace summary.');
    } finally {
      setIsGeneratingOverview(false);
    }
  }, [studentProfiles, programs, sessions, applications, userId]);

  const generateAiOverview = useCallback(async () => {
    if (!userId) return;
    setIsGeneratingOverview(true);
    try {
      const result = await generateWeeklyReport(userId);
      setAiOverviewText(result);
    } catch (err: any) {
      notifyError(err.message || 'Failed to generate overview.');
    } finally {
      setIsGeneratingOverview(false);
    }
  }, [userId]);

  const analyzeAllPendingApplications = async () => {
    if (!userId) return;
    setIsAnalyzingApps(true);
    try {
      const pending = applications.filter(a => a.status === 'pending');
      if (pending.length === 0) {
        setAppsAnalysisResult({ qualified: [], needsReview: [], rejected: [] });
        notifySuccess('No pending applications to analyze.');
        return;
      }
      const results: typeof appsAnalysisResult = { qualified: [], needsReview: [], rejected: [] };
      for (const app of pending.slice(0, 10)) {
        try {
          const analysis = await analyzeApplication(app.id);
          const lower = analysis.toLowerCase();
          if (lower.includes('qualified') || lower.includes('recommend') || lower.includes('strong')) {
            results.qualified.push({ name: app.full_name, email: app.user_email, reason: analysis.slice(0, 200) });
          } else if (lower.includes('reject') || lower.includes('weak')) {
            results.rejected.push({ name: app.full_name, email: app.user_email, reason: analysis.slice(0, 200) });
          } else {
            results.needsReview.push({ name: app.full_name, email: app.user_email, reason: analysis.slice(0, 200) });
          }
        } catch {
          results.needsReview.push({ name: app.full_name, email: app.user_email, reason: 'Analysis failed' });
        }
      }
      setAppsAnalysisResult(results);
      notifySuccess(`${pending.length} applications analyzed.`);
    } catch (err: any) {
      notifyError(err.message || 'Application analysis failed.');
    } finally {
      setIsAnalyzingApps(false);
    }
  };

  const generateSessionIntelligence = async () => {
    if (!userId) return;
    setIsGeneratingSessionIntel(true);
    try {
      const context = await contextEngine.getFullContext(userId);
      const recentSessions = (context.sessions || []).slice(0, 20);
      if (recentSessions.length === 0) {
        setSessionIntelResult({ topics: [], commonQuestions: [], averageRating: 0, ratingReason: 'No session data available.' });
        setIsGeneratingSessionIntel(false);
        return;
      }
      const prompt = `Based on these ${recentSessions.length} recent mentoring sessions, analyze:
1. Common topics/themes discussed
2. Common questions students asked
3. Overall engagement rating (1-10) with reason

Sessions: ${JSON.stringify(recentSessions.map((s: any) => ({ title: s.title, notes: s.notes?.slice(0, 300) })))}`;

      const result = await chatWithContext([{ role: 'user', content: prompt }], userId);
      setSessionIntelResult({
        topics: extractList(result, 'topics'),
        commonQuestions: extractList(result, 'questions'),
        averageRating: extractRating(result),
        ratingReason: result.slice(0, 500),
      });
    } catch {
      notifyError('Session intelligence analysis failed.');
    } finally {
      setIsGeneratingSessionIntel(false);
    }
  };

  const fetchAiRecommendations = useCallback(async () => {
    if (!userId) return;
    setIsGeneratingRecommendations(true);
    try {
      const context = await contextEngine.getFullContext(userId);
      const prompt = `Based on current platform data, suggest 3-5 actionable recommendations for this mentor covering:
1. Students needing attention
2. Sessions to schedule
3. Applications to review
4. Resource improvements
5. Program focus areas

Return as JSON array: [{title, type: "session"|"student"|"application"|"resource"|"program", description}]`;

      const result = await chatWithContext([{ role: 'user', content: prompt }], userId);
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setRecommendationsResult(parsed.slice(0, 5));
        } else {
          setRecommendationsResult([{ title: 'Analysis Complete', type: 'info', description: result.slice(0, 300) }]);
        }
      } catch {
        setRecommendationsResult([{ title: 'Recommendations', type: 'info', description: result.slice(0, 300) }]);
      }
    } catch {
      setRecommendationsResult([]);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  }, [userId]);

  const fetchAiInsights = useCallback(async () => {
    if (!userId) return;
    setIsGeneratingInsights(true);
    try {
      const result = await generateInsights(userId);

      // Try to parse JSON from the response
      let parsedInsights: AiInsight[] = [];
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const raw = JSON.parse(jsonMatch[0]);
          parsedInsights = raw.slice(0, 10).map((i: any, idx: number) => ({
            id: `insight_${Date.now()}_${idx}`,
            type: i.type || 'info',
            message: i.message || '',
            priority: i.priority || 'medium',
            timestamp: new Date(),
            actionLabel: i.actionLabel,
            actionId: i.actionId,
          }));
        }
      } catch {}

      if (parsedInsights.length === 0) {
        // Generate rule-based fallback insights
        const fallback: AiInsight[] = [];
        const inactiveStudents = studentProfiles.filter(p => p.healthStatus === 'at_risk' || p.status === 'at_risk').length;
        if (inactiveStudents > 0) fallback.push({ id: `insight_${Date.now()}_0`, type: 'warning', message: `${inactiveStudents} students need attention or are at risk.`, priority: 'high', timestamp: new Date() });
        const pendingApps = applications.filter(a => a.status === 'pending').length;
        if (pendingApps > 0) fallback.push({ id: `insight_${Date.now()}_1`, type: 'info', message: `${pendingApps} applications pending review.`, priority: 'medium', timestamp: new Date() });
        const avgProgress = studentProfiles.length > 0 ? Math.round(studentProfiles.reduce((acc, s) => acc + (s.goal_progress || 0), 0) / studentProfiles.length) : 0;
        if (avgProgress > 0) fallback.push({ id: `insight_${Date.now()}_2`, type: 'success', message: `Average student progress: ${avgProgress}%.`, priority: 'low', timestamp: new Date() });
        parsedInsights = fallback;
      }
      setInsights(parsedInsights);
    } catch {
      setInsights([]);
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [userId, studentProfiles, applications]);

  useEffect(() => {
    if (userId) {
      fetchWorkspaceSummary();
      fetchAiRecommendations();
      fetchAiInsights();
    }
  }, [userId]);

  const generateWeeklyReportNarrative = async () => {
    if (!userId) return '';
    setIsGeneratingReport(true);
    try {
      const narrative = await generateWeeklyReport(userId);
      setReportNarrative(narrative);
      return narrative;
    } catch (err: any) {
      notifyError(err.message || 'Failed to generate weekly report.');
      return '';
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadWeeklyReport = async () => {
    let narrative = reportNarrative;
    if (!narrative) narrative = await generateWeeklyReportNarrative();
    if (!narrative) narrative = 'Weekly summary report.';

    try {
      const activeStudents = studentProfiles.filter(p => p.status === 'active');
      const totalProgress = studentProfiles.reduce((acc, s) => acc + (s.goal_progress || 0), 0);
      const avgProgress = studentProfiles.length > 0 ? Math.round(totalProgress / studentProfiles.length) : 0;
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const completedSessions = sessions.filter(s => {
        const d = new Date(s.startTime || s.createdAt);
        return d >= oneWeekAgo && d <= now && s.attendanceStatus === 'attended';
      }).length;
      const reviewedApps = applications.filter(a => {
        const d = a.created_at ? new Date(a.created_at) : null;
        return d && d >= oneWeekAgo && d <= now && a.status !== 'pending';
      }).length;
      const goalsAchieved = studentProfiles.filter(s => s.goal_progress === 100).length;

      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("MENTORINO.", 15, 25);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("WEEKLY EXECUTIVE PERFORMANCE REPORT", 15, 32);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, 155, 25);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("KEY PERFORMANCE INDICATORS (THIS WEEK)", 15, 55);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 60, 195, 60);

      const metrics = [
        { label: "Active Students", value: activeStudents.length.toString() },
        { label: "Sessions Completed", value: completedSessions.toString() },
        { label: "Applications Reviewed", value: reviewedApps.toString() },
        { label: "Goals Fully Achieved", value: goalsAchieved.toString() },
        { label: "Avg. Student Progress", value: `${avgProgress}%` },
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      let xOffset = 15;
      metrics.forEach((m) => {
        doc.text(m.label, xOffset, 70);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.text(m.value, xOffset, 80);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        xOffset += 36;
      });

      doc.line(15, 90, 195, 90);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("AI-POWERED INSIGHTS & STRATEGIC SUMMARY", 15, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(doc.splitTextToSize(narrative, 180), 15, 115);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 270, 195, 270);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Mentorino AI Workspace Assistant", 15, 277);
      doc.text("Page 1 of 1", 180, 277);

      doc.save(`Weekly_Mentor_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      notifySuccess("Weekly report downloaded successfully.");
    } catch (err) {
      console.error(err);
      notifyError("Failed to generate PDF report.");
    }
  };

  const saveConversation = useCallback((title?: string) => {
    if (chatHistory.length === 0) return;
    const conv = {
      id: `conv_${Date.now()}`,
      title: title || chatHistory[0]?.content?.slice(0, 50) || 'Conversation',
      messages: chatHistory,
      updatedAt: new Date(),
    };
    const updated = [...savedConversations, conv];
    setSavedConversations(updated);
    persistConversations(updated);
    notifySuccess('Conversation saved.');
  }, [chatHistory, savedConversations, persistConversations]);

  const deleteConversation = useCallback((id: string) => {
    const updated = savedConversations.filter(c => c.id !== id);
    setSavedConversations(updated);
    persistConversations(updated);
    setPinnedConversationIds(prev => prev.filter(p => p !== id));
  }, [savedConversations, persistConversations]);

  const renameConversation = useCallback((id: string, title: string) => {
    const updated = savedConversations.map(c => c.id === id ? { ...c, title, updatedAt: new Date() } : c);
    setSavedConversations(updated);
    persistConversations(updated);
  }, [savedConversations, persistConversations]);

  const loadConversation = useCallback((id: string) => {
    const conv = savedConversations.find(c => c.id === id);
    if (conv) setChatHistory(conv.messages);
  }, [savedConversations]);

  const togglePinned = useCallback((id: string) => {
    setPinnedConversationIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    localStorage.setItem('mentorino_pinned_conversations', JSON.stringify(
      pinnedConversationIds.includes(id)
        ? pinnedConversationIds.filter(p => p !== id)
        : [...pinnedConversationIds, id]
    ));
  }, [pinnedConversationIds]);

  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  const searchConversations = useCallback((query: string) => {
    if (!query.trim()) return savedConversations;
    const lower = query.toLowerCase();
    return savedConversations.filter(c =>
      c.title.toLowerCase().includes(lower) ||
      c.messages.some(m => m.content.toLowerCase().includes(lower))
    );
  }, [savedConversations]);

  const suggestedPrompts = [
    { label: 'Students needing attention', prompt: 'Which students need attention right now?' },
    { label: 'Who missed sessions?', prompt: 'List students who missed recent sessions.' },
    { label: 'Summarize today', prompt: 'Summarize what happened today across the platform.' },
    { label: 'Pending applications', prompt: 'Which applications are pending and what should I do?' },
    { label: 'Students behind', prompt: 'Which students are falling behind on their goals?' },
    { label: 'Program completion', prompt: 'Generate a program completion report.' },
    { label: 'Attendance summary', prompt: 'Give me an attendance summary for this week.' },
    { label: 'Top performers', prompt: 'Who are the top performing students right now?' },
    { label: 'Inactive 7 days', prompt: 'Which students have been inactive for 7+ days?' },
    { label: 'Review workload', prompt: 'What is my review workload for this week?' },
    { label: 'Session recommendations', prompt: 'What sessions should I schedule next?' },
    { label: 'Create next week plan', prompt: 'Create a plan for next week based on current data.' },
  ];

  return {
    chatHistory, setChatHistory,
    userInput, setUserInput,
    isAiLoading,
    streamingContent,
    chatEndRef,
    isGeneratingOverview, setIsGeneratingOverview,
    aiOverviewText, setAiOverviewText,
    isAnalyzingApps, setIsAnalyzingApps,
    appsAnalysisResult, setAppsAnalysisResult,
    isGeneratingSessionIntel, setIsGeneratingSessionIntel,
    sessionIntelResult, setSessionIntelResult,
    isGeneratingRecommendations, setIsGeneratingRecommendations,
    recommendationsResult, setRecommendationsResult,
    isGeneratingReport, setIsGeneratingReport,
    reportNarrative, setReportNarrative,
    insights,
    isGeneratingInsights,
    savedConversations,
    pinnedConversationIds,
    suggestedPrompts,
    handleAiChat,
    handleQuickAction,
    fetchWorkspaceSummary,
    generateAiOverview,
    analyzeAllPendingApplications,
    generateSessionIntelligence,
    fetchAiRecommendations,
    fetchAiInsights,
    generateWeeklyReportNarrative,
    handleDownloadWeeklyReport,
    stopGeneration,
    saveConversation,
    deleteConversation,
    renameConversation,
    loadConversation,
    togglePinned,
    clearChat,
    searchConversations,
  };
}

function extractList(text: string, key: string): string[] {
  try {
    const match = text.match(new RegExp(`${key}[:\\s]+([^\\n]+(?:\\n[^\\n]+)*)`, 'i'));
    if (match) return match[1].split(/[,;•\-]\s*/).filter(Boolean).slice(0, 10);
  } catch {}
  return [];
}

function extractRating(text: string): number {
  try {
    const match = text.match(/(\d+)[/ ]*10/);
    if (match) return Math.min(10, Math.max(1, parseInt(match[1])));
  } catch {}
  return 0;
}
