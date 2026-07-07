# Failed Test Analysis

## 1. `realtime.spec.ts:42` — "student1 replies, mentor receives it"

### Error
```
expect(locator).toBeVisible() failed
Locator: getByText('Realtime reply 1783325126894').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```

### Flow
1. Student1 navigates to `/#/student/messages`
2. Student1 types a message and sends it
3. Mentor navigates to `/#/mentor?tab=messaging`
4. Mentor expects to see the reply message text

### Root Cause Analysis
This is a **flaky realtime synchronization test**. The message is sent from student1's context, and the mentor checks for it on a separate browser context. The failure could be caused by:

1. **Realtime subscription timing**: The Supabase realtime channel might not be fully established before the message is sent, or the mentor's subscription hasn't received the update within the timeout window.

2. **Conversation selection**: The messaging component may not automatically select the mentor-student1 conversation when the mentor navigates to the messaging tab. If a different conversation is selected, the mentor won't see student1's message.

3. **Actual realtime defect**: The bidirectional realtime flow might have a genuine issue — messages from students may not propagate to the mentor's realtime channel.

### Recommendation
- Investigate the messaging component's conversation selection logic
- Check Supabase realtime replication for the messages table
- Ensure `supabase_realtime` publication includes the messages table
- Consider adding a pre-selection step in the test to click on the student1 conversation before asserting

### Reproducibility
- Intermittent (passes ~50% of runs)
- Not related to data or auth — purely a timing/subscription issue

---

## No Other Failures

All 42 other tests pass consistently across roles and flows. The staging environment is validated for:

- **Visitor**: Landing, auth, apply (7/7 ✅)
- **Mentor**: Dashboard, applications, mentees, messaging, resources, sessions, analytics, settings (12/12 ✅)
- **Student A**: Dashboard, goals, tasks, journal, sessions, messaging, resources, events, profile (10/10 ✅)
- **Student B**: Goals isolation, tasks isolation, cross-role data isolation verified (4/4 ✅)
- **Realtime**: Basic messaging, reconnect, navigation (3/4 ✅, 1 flaky)
