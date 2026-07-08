import { createAIProvider, AIChatMessage } from './aiProvider';
import { contextEngine, type PlatformContext } from './contextEngine';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

const RATE_LIMIT_WINDOW_MS = 2000;
const lastCallTimestamps = new Map<string, number>();

function checkCallRate(fn: string): void {
  const now = Date.now();
  const last = lastCallTimestamps.get(fn) || 0;
  if (now - last < RATE_LIMIT_WINDOW_MS) {
    throw new Error('Please wait a moment before making another AI request.');
  }
  lastCallTimestamps.set(fn, now);
}

const SYSTEM_PROMPT = `You are Mentorino AI, the intelligent assistant for the Mentorino mentoring platform. You have access to ALL platform data and can analyze students, programs, sessions, applications, goals, tasks, resources, events, reviews, and analytics.

## Your Capabilities
- Analyze student performance, attendance, goals, reviews, and growth trends
- Analyze program completion rates, enrollment trends, dropout rates
- Summarize sessions, generate agendas, identify absent students
- Review applications — strengths, weaknesses, risk scores, recommendations
- Analyze progress — who's behind, who's improving, predict completion
- Recommend resources, generate learning paths, suggest next modules
- Summarize events, predict attendance, generate agendas
- Help mentors prioritize work — pending reviews, overdue goals, students needing attention
- Generate weekly/monthly reports

## Response Rules
- Be concise, specific, and actionable
- Use the context data provided — never hallucinate numbers
- If asked about something not in context, say so clearly
- Format responses with Markdown for readability
- When listing students or items, use tables where appropriate
- Highlight risks (🔴), warnings (🟡), and positive items (🟢)
- Include recommendations at the end of analyses
- Never say "I'm experiencing technical difficulties" — be honest about limitations

## Quick Action Buttons
When relevant, suggest actions using this format:
[Action: actionId] Label
Example: [Action: create-session] Create Follow-up Session
Available actions: create-session | open-student | review-application | assign-resource | schedule-event | send-reminder | approve-student | reject-application | open-program | generate-report`;

export async function getStudentAnalysis(studentId: string, mentorId: string) {
  checkCallRate('getStudentAnalysis');
  const student = await contextEngine.getStudentDetail(studentId, mentorId);
  const provider = createAIProvider();

  const prompt = `Analyze this student's performance and provide:
1. Overall assessment
2. Attendance summary (session count, trends)
3. Goal progress
4. Review feedback patterns
5. Resource engagement
6. Growth trend
7. Risk level (Low/Medium/High)
8. Recommendations
9. Next action`;

  return provider.chat({
    messages: [
      { role: 'user', content: JSON.stringify({ student, prompt }, null, 2) },
    ],
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 4096,
    temperature: 0.5,
  });
}

export async function getProgramAnalysis(programId: string, mentorId: string) {
  checkCallRate('getProgramAnalysis');
  const detail = await contextEngine.getProgramDetail(programId, mentorId);
  const provider = createAIProvider();

  const prompt = `Analyze this program's performance:
1. Enrollment numbers and trends
2. Session attendance rates
3. Completion projections
4. Dropout risk indicators
5. Mentor feedback summary
6. Recommendations for improvement`;

  return provider.chat({
    messages: [
      { role: 'user', content: JSON.stringify({ program: detail, prompt }, null, 2) },
    ],
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 4096,
    temperature: 0.5,
  });
}

export async function analyzeApplication(applicationId: string) {
  checkCallRate('analyzeApplication');
  const { data: app } = await supabase
    .from('applications')
    .select('*, student:profiles(*)')
    .eq('id', applicationId)
    .single();

  if (!app) throw new Error('Application not found');

  const provider = createAIProvider();
  const prompt = `Review this application:
1. Strengths
2. Weaknesses
3. Priority score (1-100)
4. Risk score (1-100)
5. Recommended mentor fit
6. Questions to ask in interview
7. Overall recommendation`;

  return provider.chat({
    messages: [
      { role: 'user', content: JSON.stringify({ application: app, prompt }, null, 2) },
    ],
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 4096,
    temperature: 0.4,
  });
}

export async function generateWeeklyReport(userId: string) {
  checkCallRate('generateWeeklyReport');
  const context = await contextEngine.getFullContext(userId);
  const provider = createAIProvider();

  const prompt = `Generate a comprehensive weekly report with:
1. Executive summary
2. Student progress highlights (who improved, who's falling behind)
3. Session summary (completed, attendance rate, topics covered)
4. Program milestones
5. Pending actions (reviews, applications, goals)
6. Resource engagement
7. Recommendations for next week
8. Students needing attention

Format as a professional report ready for export.`;

  return provider.chat({
    messages: [
      { role: 'user', content: JSON.stringify({ context, prompt }, null, 2) },
    ],
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 8192,
    temperature: 0.5,
  });
}

export async function generateInsights(userId: string) {
  checkCallRate('generateInsights');
  const context = await contextEngine.getFullContext(userId);
  const provider = createAIProvider();

  const prompt = `Analyze this mentor's data and generate:
1. Key observations (3-5 items)
2. Warnings/issues needing immediate attention (with 🔴)
3. Positive trends/achievements (with 🟢)
4. Recommendations for today/tomorrow
5. Students at risk
6. Resource utilization insights
7. Session quality indicators

Return as a structured JSON array of insights with: type (warning|success|info|trend), message, priority (high|medium|low), actionLabel and actionId if relevant.`;

  return provider.chat({
    messages: [
      { role: 'user', content: JSON.stringify({ context, prompt }, null, 2) },
    ],
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 4096,
    temperature: 0.4,
  });
}

function generateFallbackResponse(messages: AIChatMessage[], context: PlatformContext): string {
  const userMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const students = (context as any).students || [];
  const programs = (context as any).programs || [];
  const applications = (context as any).applications || [];
  const sessions = (context as any).sessions || [];

  if (userMsg.includes('student') && (userMsg.includes('attention') || userMsg.includes('risk') || userMsg.includes('need'))) {
    const atRisk = students.filter((s: any) => s.healthStatus === 'at_risk' || s.status === 'at_risk');
    if (atRisk.length === 0) return 'All students are currently on track. No one needs immediate attention.';
    return `**Students needing attention:**\n\n${atRisk.slice(0, 5).map((s: any) => `- ${s.name || s.email} — ${s.healthStatus === 'at_risk' ? 'At risk' : 'Needs attention'}`).join('\n')}\n\nSuggested: Schedule 1:1 sessions to address their concerns.`;
  }

  if (userMsg.includes('session') && (userMsg.includes('miss') || userMsg.includes('absent'))) {
    const missed = sessions.filter((s: any) => s.attendanceStatus === 'missed');
    if (missed.length === 0) return 'No missed sessions found. Great attendance record!';
    return `**Missed sessions:**\n\n${missed.slice(0, 5).map((s: any) => `- ${s.title} (${new Date(s.startTime || s.createdAt).toLocaleDateString()})`).join('\n')}\n\nSuggested: Follow up with these students to reschedule.`;
  }

  if (userMsg.includes('application') && (userMsg.includes('pending') || userMsg.includes('review'))) {
    const pending = applications.filter((a: any) => a.status === 'pending');
    if (pending.length === 0) return 'No pending applications. All caught up!';
    return `**Pending applications:** ${pending.length}\n\n${pending.slice(0, 5).map((a: any) => `- ${a.full_name} (${a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'})`).join('\n')}\n\nSuggested: Review and process these applications.`;
  }

  if (userMsg.includes('behind') || userMsg.includes('falling') || userMsg.includes('goal')) {
    const lowProgress = students.filter((s: any) => (s.goal_progress || 0) < 30);
    if (lowProgress.length === 0) return 'All students are making good progress on their goals.';
    return `**Students falling behind on goals:**\n\n${lowProgress.slice(0, 5).map((s: any) => `- ${s.name || s.email} — ${s.goal_progress || 0}% progress`).join('\n')}\n\nSuggested: Schedule goal review sessions to help them get back on track.`;
  }

  if (userMsg.includes('today') || userMsg.includes('summary') || userMsg.includes('overview')) {
    const activeStudents = students.filter((s: any) => s.status === 'active').length;
    const pendingApps = applications.filter((a: any) => a.status === 'pending').length;
    const sessionsToday = sessions.filter((s: any) => s.startTime && new Date(s.startTime).toDateString() === new Date().toDateString()).length;
    const atRisk = students.filter((s: any) => s.healthStatus === 'at_risk' || s.status === 'at_risk').length;
    return `**Daily Summary:**\n\n- ${activeStudents} active students\n- ${sessionsToday} session${sessionsToday !== 1 ? 's' : ''} today\n- ${pendingApps} pending application${pendingApps !== 1 ? 's' : ''}\n- ${atRisk} student${atRisk !== 1 ? 's' : ''} at risk\n- ${programs.length} active program${programs.length !== 1 ? 's' : ''}`;
  }

  if (userMsg.includes('attendance')) {
    const total = sessions.length;
    const attended = sessions.filter((s: any) => s.attendanceStatus === 'attended').length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return `**Attendance Summary:**\n\n- Overall attendance rate: ${rate}%\n- ${attended} attended out of ${total} sessions\n- ${sessions.filter((s: any) => s.attendanceStatus === 'missed').length} missed session${sessions.filter((s: any) => s.attendanceStatus === 'missed').length !== 1 ? 's' : ''}`;
  }

  if (userMsg.includes('top') || userMsg.includes('performer')) {
    const sorted = [...students].sort((a: any, b: any) => (b.goal_progress || 0) - (a.goal_progress || 0));
    if (sorted.length === 0) return 'No student data available yet.';
    return `**Top Performing Students:**\n\n${sorted.slice(0, 5).map((s: any) => `- ${s.name || s.email} — ${s.goal_progress || 0}% progress`).join('\n')}`;
  }

  if (userMsg.includes('week') || userMsg.includes('plan')) {
    const nextSessions = sessions.filter((s: any) => s.startTime && new Date(s.startTime) > new Date()).slice(0, 5);
    return `**Next Week Plan:**\n\n${nextSessions.length > 0 ? `Scheduled sessions:\n${nextSessions.map((s: any) => `- ${s.title} on ${new Date(s.startTime).toLocaleDateString()}`).join('\n')}` : 'No sessions scheduled yet.'}\n\nPriorities: Review pending applications, check on at-risk students, prepare session materials.`;
  }

  if (userMsg.includes('help') || userMsg.includes('what can you')) {
    return 'I can help you with:\n- Student performance analysis\n- Session attendance tracking\n- Application review insights\n- Goal progress monitoring\n- Weekly report generation\n- Identifying at-risk students\n- And more!\n\nTry asking about specific topics like "students needing attention" or "today\'s summary".';
  }

  const activeStudents = students.filter((s: any) => s.status === 'active').length;
  if (activeStudents > 0) {
    return `Based on your workspace data:\n- ${activeStudents} active students across ${programs.length} program${programs.length !== 1 ? 's' : ''}\n- ${sessions.length} total sessions\n- ${applications.filter((a: any) => a.status === 'pending').length} pending applications\n\nHow can I help you further? Try one of the quick commands or ask a specific question.`;
  }

  return 'I\'m your Mentorino AI assistant. I can help you analyze student data, track sessions, review applications, and more. Check the quick commands to get started.';
}

export async function chatWithContext(
  messages: AIChatMessage[],
  userId: string,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
) {
  checkCallRate('chatWithContext');
  const context = await contextEngine.getFullContext(userId);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const provider = createAIProvider();

  const systemWithContext = `${SYSTEM_PROMPT}

## Current Platform Context (as of ${context.timestamp})
${JSON.stringify(context, null, 2).slice(0, 15000)}

## Instructions for this conversation
- Use the above context to answer accurately
- If the user asks about something not in context, say "I don't have that information available yet"
- Suggest quick actions where relevant
- Be helpful and concise`;

  try {
    return await provider.chat({
      messages,
      systemPrompt: systemWithContext,
      maxTokens: 4096,
      temperature: 0.7,
      onToken,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    logger.error('aiAssistant', 'chatWithContext failed, using fallback', { error: err instanceof Error ? err.message : 'Unknown error' });
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const fallback = generateFallbackResponse(messages, context);
    if (onToken && !signal?.aborted) {
      let idx = 0;
      const interval = setInterval(() => {
        if (signal?.aborted) { clearInterval(interval); return; }
        if (idx < fallback.length) {
          const chunkSize = Math.min(3, fallback.length - idx);
          onToken(fallback.slice(idx, idx + chunkSize));
          idx += chunkSize;
        } else {
          clearInterval(interval);
        }
      }, 30);
      await new Promise(resolve => {
        const onAbort = () => { clearInterval(interval); resolve(undefined); };
        signal?.addEventListener('abort', onAbort, { once: true });
        setTimeout(() => { clearInterval(interval); resolve(undefined); }, fallback.length * 12 + 100);
      });
    }
    return fallback;
  }
}
