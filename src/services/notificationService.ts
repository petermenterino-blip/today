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

  async journalSubmitted(studentId: string, mentorId: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'New Journal Entry', message: `A student has submitted a new journal entry.`, type: 'journal', read: false });
  },

  async applicationReceived(mentorId: string, applicantName: string): Promise<void> {
    await notificationStorage.create({ userId: mentorId, title: 'New Application', message: `${applicantName} submitted a new application.`, type: 'system', read: false });
  },
};