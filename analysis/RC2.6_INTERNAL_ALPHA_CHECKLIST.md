

# RC2.6 — Internal Alpha Checklist

## Purpose
Checklist for internal alpha testers to validate all workflows before inviting external users.


## Mentor Checklist

### Login & Auth
- [ ] Can login with email + password
- [ ] Sees mentor dashboard after login
- [ ] Can reset password via "Forgot Password"
- [ ] Session persists across page refresh
- [ ] Logout clears session

### Dashboard
- [ ] Summary cards display correctly (student count, sessions, etc.)
- [ ] Dashboard loads without errors
- [ ] Navigation sidebar is visible

### Applications
- [ ] Can view list of student applications
- [ ] Can view individual application details
- [ ] Can approve an application
- [ ] Can reject an application
- [ ] Approved student appears in student list
- [ ] Rejected student sees "Pending Approval" page

### Student Management
- [ ] Can view assigned students
- [ ] Can view student profile/details
- [ ] Can add notes to student profile
- [ ] Can update student tags
- [ ] Can view student progress

### Sessions
- [ ] Can view session calendar
- [ ] Can schedule a session
- [ ] Can cancel a session
- [ ] Session changes are reflected in student view

### Calendar & Google Meet
- [ ] ⚠️ **KNOWN ISSUE**: Google Calendar sync and Meet link generation require Google OAuth setup
- [ ] Attempting to generate Meet link shows appropriate error message (not a crash)

### Messaging
- [ ] Can view conversation list
- [ ] Can open a conversation thread
- [ ] Can send a message
- [ ] Received messages appear in real-time
- [ ] Can see student name (not hardcoded)
- [ ] Can send voice messages
- [ ] WhatsApp integration works (if configured)

### Resources
- [ ] Can upload resources
- [ ] Can view uploaded resources
- [ ] Can delete resources

### Content Management (CMS)
- [ ] Can create programs
- [ ] Can create modules
- [ ] Can create lessons
- [ ] Can upload lesson resources
- [ ] Content appears correctly for students

### Reports
- [ ] Can generate reports
- [ ] Can download reports (PDF)
- [ ] Can view report history

### Settings
- [ ] Can update profile
- [ ] Can change password
- [ ] Can configure availability (if applicable)


## Student Checklist

### Invitation & Registration
- [ ] ⚠️ **KNOWN ISSUE**: No automated invitation email flow. Manual account creation required.
- [ ] Can register via /auth
- [ ] Receives confirmation/notification of pending status

### Login
- [ ] Can login with email + password
- [ ] Sees appropriate status page if application is pending
- [ ] Sees student dashboard after approval
- [ ] Session persists across page refresh
- [ ] Can logout

### Dashboard
- [ ] Summary cards display correctly
- [ ] Can see upcoming sessions
- [ ] Can see recent activity
- [ ] Can see notifications
- [ ] Dashboard loads without errors
- [ ] ⚠️ Some dashboard tabs may be empty (known issue)

### Sessions
- [ ] Can view upcoming sessions
- [ ] Can view past sessions
- [ ] Session details display correctly (date, time, mentor)
- [ ] Can join session via meeting link (if available)

### Goals
- [ ] Can create a goal
- [ ] Can view goal list
- [ ] Can update goal progress
- [ ] Can add milestones to goals
- [ ] Can mark goal as completed

### Journal
- [ ] Can create a journal entry
- [ ] Can select mood
- [ ] Can list wins and challenges
- [ ] Can view journal history
- [ ] Can edit a journal entry
- [ ] Mentor comments are visible (if any)

### Tasks
- [ ] Can view assigned tasks
- [ ] Can see task details (title, due date, priority)
- [ ] Can submit task (mark as submitted)
- [ ] Can view mentor feedback on tasks

### Messaging
- [ ] Can view conversation list
- [ ] Can open a conversation thread
- [ ] Can send a message
- [ ] Received messages appear in real-time
- [ ] Can see mentor name (not hardcoded)

### Bookings
- [ ] Can view booking calendar
- [ ] Can book a session time slot
- [ ] Can cancel a booking
- [ ] ⚠️ **KNOWN ISSUE**: Calendar sync + Meet link generation not functional

### Notifications
- [ ] New notifications appear in real-time
- [ ] Can click notification to navigate to relevant page
- [ ] Can mark notifications as read

### Settings
- [ ] Can update profile
- [ ] Can change password
- [ ] Profile changes persist


## Admin Checklist

- [ ] Can access all mentor functionality
- [ ] Can manage all users
- [ ] Can view analytics dashboard
- [ ] Can generate reports
- [ ] Can manage programs and content


## Known Issues to Communicate to Alpha Testers

| # | Issue | Impact | Workaround |
|---|-------|--------|------------|
| 1 | Google Calendar/Meet not functional | Cannot create calendar events or Meet links | Manually schedule meetings |
| 2 | No automated invitation emails | Students need manual account creation | Admin creates accounts directly |
| 3 | Empty dashboard tabs | Some tabs show nothing | Focus on working tabs |
| 4 | Empty states not implemented | Lists show blank when empty | See "no data" = expected for alpha |
| 5 | No email verification | Accounts created without confirmation | Acceptable for internal alpha |
| 6 | No mobile optimization | Some pages overflow on mobile | Use desktop for alpha testing |

## Testing Instructions
1. Start with the Mentor checklist (admin creates environment)
2. Create a test student account
3. Walk through the full Student checklist
4. Test edge cases: network failure, empty data, rapid clicking
5. Report all issues regardless of severity
