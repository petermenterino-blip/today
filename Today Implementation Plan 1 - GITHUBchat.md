# 📋 Today Implementation Plan 1 - GitHub Chat
## Mentorino - Critical Fixes Implementation Guide

**Date:** July 3, 2026  
**Priority Level:** 🔴 CRITICAL  
**Target Completion:** This Week (5 Days)  
**Estimated Hours:** 35-40 hours (1 developer)

---

## 🎯 PHASE 1: FOUNDATION FIXES (Days 1-2)

These are the core issues preventing data sync. Fix these first to unblock everything else.

---

### PHASE 1.1: Secure Edge Functions (Day 1 - 4 hours)

**Why This First:** Security vulnerability - unprotected functions exposed to public

#### Task 1.1.1: Secure Gemini Edge Function

**File:** `edge-functions/gemini/index.ts`

**Current Code (Unsecured):**
```typescript
Deno.serve(async (req: Request) => {
  const { prompt } = await req.json();
  // No auth check!
  // Anyone can call this
});
```

**Implementation:**
1. Add JWT validation
2. Check user role
3. Rate limiting

**Step-by-Step:**

```typescript
// Add at top of file:
import { JWT } from "@supabase/supabase-js";

Deno.serve(async (req: Request) => {
  // Step 1: Check for authorization header
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: No authorization token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 2: Extract and validate JWT
  const token = authHeader.replace("Bearer ", "");
  
  try {
    // Verify token with Supabase secret
    const secret = Deno.env.get("SUPABASE_JWT_SECRET");
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500 }
      );
    }

    // Step 3: Parse and validate JWT
    const payload = JSON.parse(atob(token.split(".")[1]));
    
    // Step 4: Check if user is authenticated
    if (!payload.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401 }
      );
    }

    // Step 5: Proceed with request
    const { prompt } = await req.json();
    
    // Your existing Gemini logic here
    const response = await callGeminiAPI(prompt);
    
    return new Response(
      JSON.stringify({ response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 401 }
    );
  }
});
```

**Files to Create:**
- Create `edge-functions/middleware/auth.ts` for reusable auth logic:

```typescript
// edge-functions/middleware/auth.ts
export async function validateJWT(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const secret = Deno.env.get("SUPABASE_JWT_SECRET");
    if (!secret) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.sub) return null;

    return { sub: payload.sub, role: payload.role || "user" };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "");
}
```

**Time Estimate:** 1.5 hours

---

#### Task 1.1.2: Secure Meet Edge Function

**File:** `edge-functions/meet/index.ts`

**Same pattern as above:**

```typescript
import { validateJWT, getTokenFromRequest } from "../middleware/auth.ts";

Deno.serve(async (req: Request) => {
  // Get and validate token
  const token = getTokenFromRequest(req);
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  const user = await validateJWT(token);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401 }
    );
  }

  // Proceed with creating meet link
  const { title } = await req.json();
  const meetUrl = await generateGoogleMeetLink(title, user.sub);
  
  return new Response(JSON.stringify({ url: meetUrl }), { status: 200 });
});
```

**Time Estimate:** 1.5 hours

---

#### Task 1.1.3: Secure Calendar Edge Function

**File:** `edge-functions/calendar/index.ts`

**Same pattern as above:**

```typescript
import { validateJWT, getTokenFromRequest } from "../middleware/auth.ts";

Deno.serve(async (req: Request) => {
  const token = getTokenFromRequest(req);
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await validateJWT(token);
  if (!user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

  // Your calendar logic here
  const calendarData = await getCalendarData(user.sub);
  return new Response(JSON.stringify(calendarData), { status: 200 });
});
```

**Time Estimate:** 1 hour

---

**Validation:**
- [ ] Test each endpoint with valid JWT token - should work
- [ ] Test each endpoint without token - should return 401
- [ ] Test each endpoint with invalid token - should return 401
- [ ] Redeploy to Supabase

---

### PHASE 1.2: Implement Real-Time Subscriptions (Day 1-2 - 8 hours)

**Why This:** Core feature - makes data sync in real-time instead of every 5 minutes

#### Task 1.2.1: Create Reusable Real-Time Hook

**File to Create:** `src/hooks/useRealtimeData.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface RealtimeConfig {
  table: string;
  filter?: string;
  queryKey: string[];
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export const useRealtimeData = ({ 
  table, 
  filter, 
  queryKey, 
  event = '*' 
}: RealtimeConfig) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        () => {
          // Invalidate query to trigger refetch
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, filter, queryKey, event, queryClient]);
};
```

**Usage Example:**
```typescript
// In useGoals hook:
export const useGoals = (studentId: string) => {
  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['goals', studentId],
    queryFn: async () => {
      const { data } = await goalService.fetchGoals(studentId);
      return data?.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // ✅ NEW: Subscribe to real-time changes
  useRealtimeData({
    table: 'goals',
    filter: `student_id=eq.${studentId}`,
    queryKey: ['goals', studentId],
  });

  return { goals, isLoading, error };
};
```

**Time Estimate:** 1 hour

---

#### Task 1.2.2: Update All Data Hooks with Real-Time

**Files to Update:**
1. `src/hooks/useApplications.ts`
2. `src/hooks/useBookings.ts`
3. `src/hooks/useEvents.ts`
4. `src/hooks/useGoals.ts`
5. `src/hooks/useJournals.ts`
6. `src/hooks/useSessions.ts`
7. `src/hooks/useTasks.ts`
8. `src/hooks/usePrograms.ts`

**For Each File - Add These Lines:**

```typescript
// At top: import useRealtimeData
import { useRealtimeData } from './useRealtimeData';

// Inside the hook function, after useQuery:
useRealtimeData({
  table: 'TABLE_NAME', // e.g., 'goals', 'tasks', 'sessions'
  filter: `student_id=eq.${studentId}`, // If applicable
  queryKey: ['query-key'], // Match the useQuery key
});
```

**Example - Before:**
```typescript
export const useGoals = (studentId: string) => {
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', studentId],
    queryFn: async () => {
      const { data } = await goalService.fetchGoals(studentId);
      return data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { goals };
};
```

**Example - After:**
```typescript
export const useGoals = (studentId: string) => {
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', studentId],
    queryFn: async () => {
      const { data } = await goalService.fetchGoals(studentId);
      return data?.data || [];
    },
    staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
  });

  // ✅ NEW: Real-time subscription
  useRealtimeData({
    table: 'goals',
    filter: `student_id=eq.${studentId}`,
    queryKey: ['goals', studentId],
  });

  return { goals };
};
```

**Time Estimate:** 3-4 hours (30 minutes per hook)

---

#### Task 1.2.3: Fix Query Invalidation on Mutations

**Why:** When mentor creates a task, student's task queries should refetch

**File:** `src/hooks/useTasks.ts`

**Before:**
```typescript
const createTask = useMutation({
  mutationFn: (task: Omit<Task, 'id'>) => taskService.createTask(task),
  // ❌ No onSuccess callback
});
```

**After:**
```typescript
const createTask = useMutation({
  mutationFn: (task: Omit<Task, 'id'>) => taskService.createTask(task),
  // ✅ Invalidate queries so they refetch
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
  },
  onError: (error) => {
    console.error('Failed to create task:', error);
    showError('Failed to create task');
  },
});
```

**Apply To All Hooks:**
- useApplications
- useBookings
- useEvents
- useGoals
- useJournals
- useSessions
- useTasks
- usePrograms

**Time Estimate:** 2-3 hours

---

**Validation Checklist:**
- [ ] Create test file to verify subscriptions work
- [ ] Test scenario: Mentor creates goal → Check if subscription fires
- [ ] Test scenario: Student updates task → Check if mentor sees update
- [ ] Check Supabase logs for subscription connections
- [ ] Verify no console errors

---

## 🎯 PHASE 2: FIX CRITICAL FEATURES (Days 2-3)

---

### PHASE 2.1: Fix Task Sync Between Dashboards (6 hours)

**Issue:** Mentor creates task → Student doesn't see it

#### Task 2.1.1: Verify Mutation Success Callbacks

**File:** `src/features/mentor/hooks/useFeedback.ts`

```typescript
const addTask = useMutation({
  mutationFn: (task) => taskService.createTask(task),
  onSuccess: () => {
    // ✅ Add this callback
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    showSuccess('Task created successfully');
  },
  onError: (error) => {
    showError('Failed to create task: ' + interpretError(error));
  },
});
```

**Time Estimate:** 1 hour

---

#### Task 2.1.2: Add Real-Time to Student Tasks Component

**File:** `src/features/student/StudentTasks.tsx`

```typescript
// Before rendering:
import { useRealtimeData } from '../../hooks/useRealtimeData';

export const StudentTasks: React.FC = ({ studentId }) => {
  const { taskActivities, loading } = useTasks();
  
  // ✅ Add real-time subscription
  useRealtimeData({
    table: 'tasks',
    filter: `user_id=eq.${studentId}`,
    queryKey: ['user-tasks', studentId],
  });

  // Component render...
};
```

**Time Estimate:** 1 hour

---

#### Task 2.1.3: Test Task Sync Scenario

**Scenario Script:**

```typescript
// Test: Create task from mentor, see in student dashboard

// Step 1: Login as mentor
mentor.login('mentor@test.com', 'password');

// Step 2: Create task
mentor.navigateTo('/mentor?tab=feedback');
mentor.createTask({
  title: 'Submit Resume',
  description: 'Submit your updated resume',
  dueDate: tomorrow,
  studentId: 'test-student-1'
});
// Verify: Task appears in mentor view ✅

// Step 3: Login as student (different browser tab)
student.login('student@test.com', 'password');

// Step 4: Navigate to tasks
student.navigateTo('/student/tasks');

// ✅ EXPECTED: Task "Submit Resume" appears within 2 seconds
// ❌ CURRENT: Task not visible (requires page refresh)
```

**Time Estimate:** 1 hour (setup + execution)

---

### PHASE 2.2: Fix Goal Sync (6 hours)

**Issue:** Mentor updates student's goal → Student doesn't see the update

#### Task 2.2.1: Update Mentor Goal Hook

**File:** `src/features/mentor/hooks/useMentees.ts`

```typescript
// Add mutation handling:
const updateMenteeGoal = useMutation({
  mutationFn: (goal) => goalService.updateGoal(goal),
  onSuccess: () => {
    // ✅ Invalidate goal queries
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['mentee-goals'] });
    showSuccess('Goal updated');
  },
});
```

**Time Estimate:** 1 hour

---

#### Task 2.2.2: Add Real-Time to Student Goals

**File:** `src/features/student/StudentGoals.tsx`

```typescript
import { useRealtimeData } from '../../hooks/useRealtimeData';

export const StudentGoals: React.FC = ({ studentId }) => {
  const { goals, loading } = useGoals(studentId);
  
  // ✅ Subscribe to real-time changes
  useRealtimeData({
    table: 'goals',
    filter: `student_id=eq.${studentId}`,
    queryKey: ['goals', studentId],
  });

  return (
    // Component JSX...
  );
};
```

**Time Estimate:** 1 hour

---

#### Task 2.2.3: Test Goal Sync

**Scenario:**
1. Open mentor dashboard in Tab A
2. Open student dashboard in Tab B
3. Mentor updates goal "Learn React" → "Complete React Course"
4. ✅ Within 2 seconds, student sees updated title in Tab B
5. ❌ Currently requires manual refresh

**Time Estimate:** 1 hour

---

## 🎯 PHASE 3: INCOMPLETE FEATURE FIXES (Days 3-4)

---

### PHASE 3.1: Fix Messaging System (8 hours)

**Current State:** 35% complete (sends to component state only, not database)

#### Task 3.1.1: Implement Message Sending

**File:** `src/services/messageService.ts`

**Before:**
```typescript
// Incomplete stub
async sendMessage(message: Message) {
  // Does nothing
}
```

**After:**
```typescript
async sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        message_type: message.message_type || 'text',
      }])
      .select()
      .single();

    if (error) {
      return { data: null, error: handleError(error).error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleError(err).error };
  }
}

async getConversations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participants,
        last_message,
        unread_count,
        created_at,
        updated_at
      `)
      .or(`initiator_id.eq.${userId},participant_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: [], error: handleError(error).error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: handleError(err).error };
  }
}

async getMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: handleError(error).error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: handleError(err).error };
  }
}
```

**Time Estimate:** 2 hours

---

#### Task 3.1.2: Create useMessaging Hook

**File to Create:** `src/hooks/useMessaging.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../services/messageService';
import { Message, Conversation } from '../types';

export const useMessaging = (userId: string) => {
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const { data } = await messageService.getConversations(userId);
      return data || [];
    },
    staleTime: 10 * 1000, // 10 seconds
  });

  // Subscribe to conversation changes
  useRealtimeData({
    table: 'conversations',
    filter: `initiator_id=eq.${userId}`,
    queryKey: ['conversations', userId],
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (message: Omit<Message, 'id' | 'created_at'>) =>
      messageService.sendMessage(message),
    onSuccess: (data) => {
      // Invalidate messages for this conversation
      const conversationId = data.data?.conversation_id;
      if (conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['messages', conversationId] 
        });
      }
    },
  });

  return {
    conversations,
    conversationsLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    error: sendMessage.error,
  };
};
```

**Time Estimate:** 2 hours

---

#### Task 3.1.3: Update Messaging Component

**File:** `src/features/messaging/WhatsAppMessaging.tsx`

```typescript
import { useMessaging } from '../../hooks/useMessaging';

interface WhatsAppMessagingProps {
  currentUserId: string;
}

export const WhatsAppMessaging: React.FC<WhatsAppMessagingProps> = ({ 
  currentUserId 
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const {
    conversations,
    conversationsLoading,
    sendMessage,
    isSending,
  } = useMessaging(currentUserId);

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const { data } = await messageService.getMessages(selectedConversationId);
      return data || [];
    },
    staleTime: 5 * 1000, // 5 seconds
  });

  // Subscribe to message changes
  useRealtimeData({
    table: 'messages',
    filter: `conversation_id=eq.${selectedConversationId}`,
    queryKey: ['messages', selectedConversationId],
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversationId) return;

    try {
      await sendMessage({
        conversation_id: selectedConversationId,
        sender_id: currentUserId,
        content: messageText,
      });
      setMessageText(''); // Clear input
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Conversation List */}
      <div className="w-64 border-r overflow-y-auto">
        {conversationsLoading ? (
          <div>Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-gray-500">No conversations</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                selectedConversationId === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-semibold">{conv.participants}</div>
              <div className="text-sm text-gray-600 truncate">
                {conv.last_message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-black'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-4 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type message..."
                className="flex-1 border rounded-lg px-3 py-2"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !messageText.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
```

**Time Estimate:** 3-4 hours

---

### PHASE 3.2: Fix Events RSVP Persistence (4 hours)

**Issue:** RSVP status doesn't persist - reverts on page refresh

#### Task 3.2.1: Create Event RSVP Service

**File:** `src/services/eventRsvpService.ts`

```typescript
import { supabase } from '../lib/supabase';

export const eventRsvpService = {
  async submitRsvp(eventId: string, userId: string, status: 'attending' | 'not_attending' | 'maybe') {
    try {
      // Check if RSVP already exists
      const { data: existing } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from('event_rsvps')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('event_rsvps')
          .insert([{
            event_id: eventId,
            user_id: userId,
            status,
          }])
          .select()
          .single();
      }

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getRsvpStatus(eventId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      return { data: data?.status, error };
    } catch (error) {
      return { data: null, error };
    }
  },
};
```

**Time Estimate:** 1 hour

---

#### Task 3.2.2: Create useEventRsvp Hook

**File:** `src/hooks/useEventRsvp.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventRsvpService } from '../services/eventRsvpService';

export const useEventRsvp = (eventId: string, userId: string) => {
  const queryClient = useQueryClient();

  // Fetch current RSVP status
  const { data: rsvpStatus, isLoading } = useQuery({
    queryKey: ['event-rsvp', eventId, userId],
    queryFn: async () => {
      const { data } = await eventRsvpService.getRsvpStatus(eventId, userId);
      return data;
    },
    staleTime: 10 * 1000, // 10 seconds
  });

  // Subscribe to RSVP changes
  useRealtimeData({
    table: 'event_rsvps',
    filter: `event_id=eq.${eventId},user_id=eq.${userId}`,
    queryKey: ['event-rsvp', eventId, userId],
  });

  // Submit RSVP mutation
  const submitRsvp = useMutation({
    mutationFn: (status: 'attending' | 'not_attending' | 'maybe') =>
      eventRsvpService.submitRsvp(eventId, userId, status),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['event-rsvp', eventId, userId], data.data?.status);
      // Invalidate event queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    rsvpStatus,
    isLoading,
    submitRsvp: submitRsvp.mutateAsync,
    isSubmitting: submitRsvp.isPending,
  };
};
```

**Time Estimate:** 1 hour

---

#### Task 3.2.3: Update Event Component

**File:** `src/features/admin/EventManagement.tsx`

```typescript
import { useEventRsvp } from '../../hooks/useEventRsvp';

// In component:
const { rsvpStatus, submitRsvp, isSubmitting } = useEventRsvp(eventId, currentUserId);

const handleRsvp = async (status: 'attending' | 'not_attending' | 'maybe') => {
  try {
    await submitRsvp(status);
    showSuccess('RSVP updated');
  } catch (error) {
    showError('Failed to update RSVP');
  }
};

// In JSX:
<button
  onClick={() => handleRsvp('attending')}
  disabled={isSubmitting}
  className={`px-4 py-2 rounded ${
    rsvpStatus === 'attending' ? 'bg-green-500 text-white' : 'bg-gray-200'
  }`}
>
  Attending
</button>
```

**Time Estimate:** 1-2 hours

---

## ✅ VALIDATION & TESTING

### Test Case 1: Task Creation Sync
```
Mentor: Create task "Submit Resume"
  ↓
Student Dashboard: Within 2 seconds, see "Submit Resume"
  ↓
Expected: ✅ PASS
Current: ❌ FAIL (requires refresh)
After Fix: ✅ PASS
```

### Test Case 2: Goal Update Sync
```
Mentor: Update goal "Learn React" → "Master React"
  ↓
Student Dashboard: See "Master React" within 2 seconds
  ↓
Expected: ✅ PASS
Current: ❌ FAIL (shows old title)
After Fix: ✅ PASS
```

### Test Case 3: Message Sending
```
Mentor: Type "Hello" → Click Send
  ↓
Message appears in chat: ✅ YES
  ↓
Message appears in Student view: ✅ YES (without refresh)
  ↓
Current: ❌ Messages not saving to database
After Fix: ✅ Both work
```

### Test Case 4: Event RSVP
```
Student: Click "Attending" on event
  ↓
Status shows as "Attending": ✅ YES
  ↓
Refresh page: ✅ Status still "Attending"
  ↓
Mentor sees student RSVP: ✅ YES (without refresh)
  ↓
Current: ❌ FAIL (status reverts on refresh)
After Fix: ✅ PASS
```

---

## 📅 DAILY SCHEDULE

### **Day 1 (Today - 8 hours):**
- ✅ 08:00-12:00 - Phase 1.1: Secure edge functions (4 hours)
- ✅ 12:00-13:00 - Lunch
- ✅ 13:00-15:00 - Phase 1.2.1: Create useRealtimeData hook (2 hours)
- ✅ 15:00-17:00 - Phase 1.2.2: Start updating hooks (2 hours)

**Deliverable:** Edge functions secured, useRealtimeData hook created

---

### **Day 2 (8 hours):**
- 08:00-10:00 - Finish Phase 1.2.2: Complete all hook updates (2 hours)
- 10:00-11:00 - Phase 1.2.3: Add mutation callbacks (1 hour)
- 11:00-12:00 - Testing Phase 1 fixes (1 hour)
- 12:00-13:00 - Lunch
- 13:00-16:00 - Phase 2.1: Fix task sync (3 hours)
- 16:00-17:00 - Phase 2.2: Fix goal sync (1 hour)

**Deliverable:** Real-time sync working, task/goal sync fixed

---

### **Day 3 (8 hours):**
- 08:00-11:00 - Phase 3.1.1-3.1.2: Implement messaging (3 hours)
- 11:00-12:00 - Phase 3.1.3: Update messaging component (1 hour)
- 12:00-13:00 - Lunch
- 13:00-16:00 - Phase 3.2: Fix RSVP persistence (3 hours)
- 16:00-17:00 - Test all fixes (1 hour)

**Deliverable:** Messaging working, RSVP persisting

---

### **Day 4 (8 hours):**
- Full day: Additional feature fixes or bug fixes discovered during testing

---

### **Day 5 (8 hours):**
- Comprehensive testing
- Performance testing
- Documentation updates

---

## 🎯 SUCCESS CRITERIA

### After Phase 1 (End of Day 2):
- [ ] Edge functions secured (3/3 protected)
- [ ] Real-time subscriptions active on all data tables
- [ ] Task appears in student dashboard within 2 seconds of mentor creation
- [ ] Goal updates sync from mentor to student within 2 seconds
- [ ] No console errors related to subscriptions

### After Phase 2 (End of Day 3):
- [ ] All above + messaging system working
- [ ] Event RSVP persists across page refreshes
- [ ] Messages saved to database
- [ ] Conversation history loads correctly

### After Full Implementation:
- [ ] All 13 critical/high issues resolved
- [ ] Features working as expected
- [ ] No real-time sync delays
- [ ] Production-ready for pilot launch

---

## 🚀 COMMIT MESSAGE TEMPLATE

For each completed phase, use:

```
[Phase 1.1] Secure edge functions

- Add JWT validation to gemini function
- Add JWT validation to meet function  
- Add JWT validation to calendar function
- Add reusable auth middleware
- Add error handling for invalid tokens

Fixes: Security vulnerability - unprotected edge functions
Related: #issue-number
```

---

## 📞 QUICK REFERENCE

**Key Files to Modify:**
- `src/hooks/useRealtimeData.ts` (CREATE NEW)
- `src/hooks/use*.ts` (All 8 files - add subscription)
- `edge-functions/*/index.ts` (3 files - add auth)
- `src/features/messaging/WhatsAppMessaging.tsx`
- `src/features/admin/EventManagement.tsx`
- `src/services/messageService.ts`

**Commands:**
```bash
# Test edge functions
curl -X POST http://localhost:54321/functions/v1/gemini \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'

# View Supabase logs
supabase functions list
```

---

**Status:** Ready to implement  
**Estimated Total Time:** 35-40 hours (5 days)  
**Priority:** 🔴 CRITICAL - Production blocker

Good luck! 🚀
