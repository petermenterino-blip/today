export const QK = {
  actionItems: 'actionItems',
  applications: 'applications',
  bookings: 'bookings',
  credentials: 'credentials',
  customForms: 'customForms',
  eventRsvp: 'event-rsvp',
  events: 'events',
  goals: 'goals',
  journals: 'journals',
  notifications: 'notifications',
  programs: 'programs',
  resources: 'resources',
  sessions: 'sessions',
  studentList: 'studentList',
  tasks: 'tasks',
  transactions: 'transactions',
  visitorBookings: 'visitorBookings',
  gallery: 'gallery',
  socialLinks: 'socialLinks',
  websiteSettings: 'websiteSettings',
} as const;

export const STALE_TIMES = {
  frequently: 0,
  default: 5 * 60 * 1000,
  rare: 30 * 60 * 1000,
} as const;
