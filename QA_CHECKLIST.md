# QA_CHECKLIST.md

**Date:** 2026-07-06  
**Application:** Mentorino  
**Environment:** Local Production (http://localhost:4173)

---

## Student Workflows

### Authentication
- [ ] Register with email/password
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Logout clears session
- [ ] Forgot Password sends reset email
- [ ] Session persists across page reload
- [ ] Session expires after timeout
- [ ] Invalid token shows login screen

### Dashboard
- [ ] Dashboard loads with user data
- [ ] Upcoming events displayed
- [ ] Recent activity shown
- [ ] Navigation sidebar works
- [ ] Loading states show spinners
- [ ] Empty state shows appropriate message

### Profile
- [ ] View profile
- [ ] Edit profile fields
- [ ] Upload avatar
- [ ] Avatar displays correctly
- [ ] Validation on save

### File Upload
- [ ] Upload PDF file
- [ ] Upload DOCX file
- [ ] Upload image file
- [ ] Upload ZIP file
- [ ] File type validation rejects invalid types
- [ ] File size validation rejects oversized files
- [ ] Upload progress indicator
- [ ] Upload error handled gracefully

### Booking
- [ ] View available slots
- [ ] Book a session
- [ ] Cancel a booking
- [ ] Booking confirmation shown
- [ ] Calendar displays correctly

### Messaging
- [ ] View conversations
- [ ] Send message
- [ ] Receive message (realtime)
- [ ] File attachment in message
- [ ] Empty conversation state
- [ ] Unread count badge

### AI Assistant
- [ ] AI chat loads
- [ ] Send query
- [ ] Receive response
- [ ] Error handling for AI failures
- [ ] Loading state during AI processing

### Notifications
- [ ] Notification bell shows count
- [ ] Click notification navigates correctly
- [ ] Mark as read works
- [ ] Empty notification state

### Settings
- [ ] Change password
- [ ] Update notification preferences
- [ ] Theme toggle
- [ ] Settings persist after reload

---

## Mentor Workflows

### Authentication
- [ ] Login with mentor credentials
- [ ] Mentor dashboard loads

### Dashboard
- [ ] Overview metrics correct
- [ ] Student list loads
- [ ] Recent activity shown
- [ ] Charts render properly

### Student Management
- [ ] View assigned students
- [ ] Approve application
- [ ] Reject application with reason
- [ ] View student progress
- [ ] Add notes to student

### Messaging
- [ ] Conversation list loads
- [ ] Send message to student
- [ ] Receive message (realtime)
- [ ] Group messaging works
- [ ] Message search

### Files
- [ ] Share file with student
- [ ] View shared files
- [ ] Delete shared file
- [ ] Download file

### Meetings
- [ ] Schedule meeting
- [ ] View scheduled meetings
- [ ] Cancel meeting
- [ ] Meeting reminders

### Tasks & Goals
- [ ] Create task for student
- [ ] Assign task deadline
- [ ] Mark task complete
- [ ] Track student goal progress
- [ ] Create goal milestones

### Notes
- [ ] Add note to student profile
- [ ] View notes history
- [ ] Edit note

### Analytics
- [ ] Student progress charts
- [ ] BI analytics load
- [ ] Export data
- [ ] Filter by date range
- [ ] Empty analytics state

---

## Mentor Workflows

### Authentication
- [ ] Login with mentor credentials
- [ ] Mentor dashboard loads

### Dashboard
- [ ] System metrics displayed
- [ ] User counts correct
- [ ] Application queue

### Applications
- [ ] View pending applications
- [ ] Approve application
- [ ] Reject application
- [ ] Application details view

### User Management
- [ ] List all users
- [ ] Search users
- [ ] Filter by role
- [ ] View user details
- [ ] Deactivate user

### Analytics
- [ ] System-wide analytics
- [ ] Revenue reports
- [ ] User growth charts

### Broadcast
- [ ] Send broadcast email
- [ ] Send broadcast notification
- [ ] Broadcast delivery status

### Settings
- [ ] System settings
- [ ] Email templates
- [ ] Feature flags

### Gallery
- [ ] View gallery images
- [ ] Upload image
- [ ] Delete image
- [ ] Gallery permissions

---

## Cross-cutting Checks

### Error States
- [ ] 404 page for unknown routes
- [ ] Network error shows friendly message
- [ ] API error shows toast notification
- [ ] Form validation errors
- [ ] Server error (500) handled gracefully

### Loading States
- [ ] Skeleton loaders for lists
- [ ] Spinner for data fetches
- [ ] Button loading state during mutations
- [ ] Page transition loading

### Empty States
- [ ] No messages state
- [ ] No notifications state
- [ ] No files state
- [ ] No bookings state
- [ ] No students state
- [ ] No analytics data state

### Offline/Reconnect
- [ ] Offline banner displayed
- [ ] Operations queued offline
- [ ] Reconnect restores functionality
- [ ] No data loss on reconnect

### Security
- [ ] Student cannot access mentor routes
- [ ] Mentor cannot access mentor routes
- [ ] Unauthenticated user redirected to login
- [ ] RLS prevents accessing other user's data
- [ ] Session token validated on API calls
- [ ] XSS: script injection in forms prevented
- [ ] File upload path traversal prevented

### Storage Permissions
- [ ] Student can only read own files
- [ ] Mentor can read assigned student files
- [ ] Public bucket accessible without auth
- [ ] Private bucket requires signed URL
- [ ] Upload enforces size limits
- [ ] Upload enforces MIME types

---

## Summary

| Area | Total Checks |
|------|-------------|
| Student | 40 |
| Mentor | 35 |
| Mentor | 20 |
| Cross-cutting | 35 |
| **Total** | **130** |
