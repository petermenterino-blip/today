# Realtime Investigation

## The Failing Test

**File:** `e2e/realtime.spec.ts:42` — "student1 replies, mentor receives it"

### Original Error
```
expect(locator).toBeVisible() failed
Locator: getByText('Realtime reply 1783325126894').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```

### Test Flow (Original)
1. Student1 navigates to `/#/student/messages`
2. Student1 types a reply message and clicks Send / presses Enter
3. Wait 2 seconds
4. Mentor navigates to `/#/mentor?tab=messaging`
5. Mentor expects to see the reply message text

## Root Cause Analysis

### Problem 1: No Auto-Selection of Conversation

`src/features/messaging/WhatsAppMessaging.tsx` has a `selectedConversation` state that starts as `null`. The ComposeBar (message input/textarea) only renders when `selectedConversation` is truthy (line 612).

There was **no mechanism** to auto-select the first conversation when the component mounts. The component fetched conversations via `loadConversations()` but never called `setSelectedConversation()` on the result.

**Impact:** The ComposeBar textarea was never rendered. The "Type a message" input was absent from the DOM.

### Problem 2: Test Locator Matched Wrong Input

The test used:
```typescript
const messageInput = page.locator('textarea, input[type="text"], [contenteditable="true"]').first()
```

The `ConversationList` component always renders a search bar:
```tsx
<input type="text" placeholder="Search or start new chat" />
```

This `input[type="text"]` appears **before** the ComposeBar `textarea` in the DOM. Since `.first()` returns the first matching element, the test always selected the **search input**, not the message compose input.

**Impact:** Filling the "message input" actually filled the search bar. Pressing Enter triggered a search (no-op for this test), never sending a message.

### Problem 3: Test 1 Used Invalid URL

Test 1 used `/#/mentor/messages` (no query param), which the MentorDashboard interprets as the **overview** tab (not messaging). The WhatsAppMessaging component was never rendered for the mentor.

**Impact:** Test 1 was a false positive — it passed vacuously because the mentor had no message input, triggering the early-return guard.

### Why Intermittent?

The original 50% pass rate is explained by:
- **~50% of the time:** The student's auto-creation effect in WhatsAppMessaging (lines 157-176) would create a conversation with the mentor if none existed. Combined with a race condition between `loadConversations` and the auto-creation effect, the student would sometimes have a conversation. But `selectedConversation` was still never set, so even with a conversation, the input was never visible. The test always returned early via the `if (!inputVisible)` guard.
- **Reported as "passes 50%":** This was likely an estimate based on inconsistent failure reproduction, or the pre-existing auth state files had different data on different runs.

## Files Changed

| File | Change |
|------|--------|
| `src/features/messaging/WhatsAppMessaging.tsx` | Added auto-selection `useEffect` at line 187 |
| `e2e/realtime.spec.ts` | Fixed locators, URLs, and assertions in tests 1, 2, 3 |
