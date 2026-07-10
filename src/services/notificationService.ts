import { notificationStorage } from './notificationStorage';

export const notify = {
  async bookingConfirmed(userId: string, mentorId: string, date: string, time: string): Promise<void> {
    await notificationStorage.create({ userId, title: 'Booking Confirmed', message: `Your booking on ${date} at ${time} has been confirmed.`, type: 'session', read: false });
    await notificationStorage.create({ userId: mentorId, title: 'New Booking', message: `A new booking has been made for ${date} at ${time}.`, type: 'session', read: false });
  },

  async goalCompleted(studentId: string, mentorId: string, goalTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Goal Completed', message: `Congratulations! You completed "${goalTitle}".`, type: 'goal', read: false });
    await notificationStorage.create({ userId: mentorId, title: 'Goal Completed', message: `Your student completed "${goalTitle}".`, type: 'goal', read: false });
  },

  async taskCompleted(studentId: string, mentorId: string, taskTitle: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'Task Completed', message: `Your student completed "${taskTitle}".`, type: 'task', read: false });
  },

  async taskAssigned(studentId: string, mentorId: string, taskTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'New Task Assigned', message: `You have a new task: "${taskTitle}".`, type: 'task', read: false });
  },

  async sessionScheduled(studentId: string, mentorId: string, sessionTitle: string, startTime: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Session Scheduled', message: `"${sessionTitle}" scheduled for ${new Date(startTime).toLocaleDateString()}.`, type: 'session', read: false });
    await notificationStorage.create({ userId: mentorId, title: 'Session Scheduled', message: `"${sessionTitle}" scheduled for ${new Date(startTime).toLocaleDateString()}.`, type: 'session', read: false });
  },

  async sessionRescheduled(studentId: string, mentorId: string, sessionTitle: string, startTime: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Session Rescheduled', message: `"${sessionTitle}" rescheduled to ${new Date(startTime).toLocaleDateString()}.`, type: 'session', read: false });
    await notificationStorage.create({ userId: mentorId, title: 'Session Rescheduled', message: `"${sessionTitle}" rescheduled to ${new Date(startTime).toLocaleDateString()}.`, type: 'session', read: false });
  },

  async sessionCancelled(studentId: string, mentorId: string, sessionTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Session Cancelled', message: `"${sessionTitle}" has been cancelled.`, type: 'session', read: false });
    await notificationStorage.create({ userId: mentorId, title: 'Session Cancelled', message: `"${sessionTitle}" has been cancelled.`, type: 'session', read: false });
  },

  async journalSubmitted(studentId: string, mentorId: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'New Journal Entry', message: `A student has submitted a new journal entry.`, type: 'journal', read: false });
  },

  async applicationReceived(mentorId: string, applicantName: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'New Application', message: `${applicantName} submitted a new application.`, type: 'system', read: false });
  },

  // ── Review Notifications ──
  async reviewAssigned(studentId: string, reviewTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'New Review', message: `You have a new review: "${reviewTitle}"`, type: 'review', read: false });
  },

  async reviewSubmitted(mentorId: string, studentName: string, reviewTitle: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'Review Submitted', message: `${studentName} submitted "${reviewTitle}" for review`, type: 'review', read: false });
  },

  async reviewCompleted(studentId: string, reviewTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Review Completed', message: `"${reviewTitle}" has been completed. Check your feedback!`, type: 'review', read: false });
  },

  async reviewReturned(studentId: string, reviewTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Review Returned', message: `"${reviewTitle}" was returned for revision`, type: 'review', read: false });
  },

  async reviewDueSoon(studentId: string, reviewTitle: string, dueDate: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Review Due Soon', message: `"${reviewTitle}" is due ${new Date(dueDate).toLocaleDateString()}`, type: 'review', read: false });
  },

  async reviewOverdue(studentId: string, reviewTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Review Overdue', message: `"${reviewTitle}" is now overdue`, type: 'review', read: false });
  },

  // ── Form Notifications ──
  async formAssigned(studentId: string, formTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'New Form Assigned', message: `You have a new form to complete: "${formTitle}"`, type: 'form', read: false });
  },

  async formSubmitted(studentId: string, mentorId: string, formTitle: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'Form Submitted', message: `Student submitted "${formTitle}"`, type: 'form', read: false });
  },

  // ── File Notifications ──
  async fileShared(studentId: string, mentorId: string, fileName: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'New File Shared', message: `A new file has been shared with you: "${fileName}"`, type: 'file', read: false });
    await notificationStorage.create({ userId: mentorId, title: 'File Shared', message: `File "${fileName}" was shared with student.`, type: 'file', read: false });
  },

  // ── Credential Notifications ──
  async credentialIssued(studentId: string, credentialTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Credential Issued', message: `You have received a credential: "${credentialTitle}"`, type: 'credential', read: false });
  },

  async credentialRevoked(studentId: string, credentialTitle: string): Promise<void> {
    await notificationStorage.create({ userId: studentId, title: 'Credential Revoked', message: `Your credential "${credentialTitle}" has been revoked.`, type: 'credential', read: false });
  },

  // ── Event Notifications ──
  async eventCreated(userIds: string[], eventTitle: string, eventDate: string): Promise<void> {
    for (const userId of userIds) {
      await notificationStorage.create({ userId, title: 'New Event Created', message: `"${eventTitle}" has been scheduled for ${eventDate}.`, type: 'event', read: false });
    }
  },

  async eventRegistered(userId: string, eventTitle: string): Promise<void> {
    await notificationStorage.create({ userId, title: 'Registration Confirmed', message: `You are registered for "${eventTitle}".`, type: 'event', read: false });
  },

  async eventRegistrationCancelled(userId: string, eventTitle: string): Promise<void> {
    await notificationStorage.create({ userId, title: 'Registration Cancelled', message: `Your registration for "${eventTitle}" has been cancelled.`, type: 'event', read: false });
  },

  async eventReminder24h(userIds: string[], eventTitle: string, eventDate: string, eventTime: string): Promise<void> {
    for (const userId of userIds) {
      await notificationStorage.create({ userId, title: 'Event Reminder (24h)', message: `"${eventTitle}" is tomorrow (${eventDate} at ${eventTime}).`, type: 'event', read: false });
    }
  },

  async eventReminder1h(userIds: string[], eventTitle: string, eventTime: string): Promise<void> {
    for (const userId of userIds) {
      await notificationStorage.create({ userId, title: 'Event Starting Soon (1h)', message: `"${eventTitle}" starts at ${eventTime}.`, type: 'event', read: false });
    }
  },

  async eventStarted(userIds: string[], eventTitle: string, meetingLink?: string): Promise<void> {
    for (const userId of userIds) {
      await notificationStorage.create({ userId, title: 'Event Started', message: `"${eventTitle}" is now live!${meetingLink ? ` Join: ${meetingLink}` : ''}`, type: 'event', read: false });
    }
  },

  async eventCancelled(userIds: string[], eventTitle: string): Promise<void> {
    for (const userId of userIds) {
      await notificationStorage.create({ userId, title: 'Event Cancelled', message: `"${eventTitle}" has been cancelled.`, type: 'event', read: false });
    }
  },

  async eventUpdated(userIds: string[], eventTitle: string): Promise<void> {
    for (const userId of userIds) {
      await notificationStorage.create({ userId, title: 'Event Updated', message: `"${eventTitle}" has been updated. Check the details.`, type: 'event', read: false });
    }
  },

  async waitlistPromoted(userId: string, eventTitle: string): Promise<void> {
    await notificationStorage.create({ userId, title: 'Waitlist Promoted', message: `You've been promoted from the waitlist for "${eventTitle}".`, type: 'event', read: false });
  },

  async attendanceRecorded(userId: string, eventTitle: string, status: string): Promise<void> {
    await notificationStorage.create({ userId, title: 'Attendance Recorded', message: `Your attendance for "${eventTitle}" has been marked as ${status}.`, type: 'event', read: false });
  },

  async messageReceived(userId: string, senderName: string, preview: string): Promise<void> {
    await notificationStorage.create({ userId, title: `New message from ${senderName}`, message: preview, type: 'message', read: false });
  },
};
