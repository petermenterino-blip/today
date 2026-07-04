import { createAIProvider, AIChatMessage } from './aiProvider';
import { contextEngine, PlatformContext } from './contextEngine';
import { supabase } from '../lib/supabase';

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

export async function chatWithContext(
  messages: AIChatMessage[],
  userId: string,
  onToken?: (token: string) => void,
) {
  const context = await contextEngine.getFullContext(userId);
  const provider = createAIProvider();

  const systemWithContext = `${SYSTEM_PROMPT}

## Current Platform Context (as of ${context.timestamp})
${JSON.stringify(context, null, 2).slice(0, 15000)}

## Instructions for this conversation
- Use the above context to answer accurately
- If the user asks about something not in context, say "I don't have that information available yet"
- Suggest quick actions where relevant
- Be helpful and concise`;

  return provider.chat({
    messages,
    systemPrompt: systemWithContext,
    maxTokens: 4096,
    temperature: 0.7,
    onToken,
  });
}
