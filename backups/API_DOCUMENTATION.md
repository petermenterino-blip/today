# API Documentation

## Overview

The application uses **Supabase** as the backend. All API calls are made client-side via the Supabase JavaScript client (`@supabase/supabase-js`). There is no custom REST API server.

## Service Interfaces

### Auth (`authService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| login | email, password | Session + User | Sign in with email/password |
| signup | email, password, options | Session + User | Create account |
| logout | - | void | Sign out |
| getCurrentUser | - | User | Get current user |
| getSession | - | Session | Get current session |
| refreshSession | - | Session | Force refresh session |
| resetPasswordForEmail | email | void | Send password reset email |
| updatePassword | password | void | Update password |
| getProfile | userId | Profile | Get user profile |
| updateProfile | userId, data | Profile | Update user profile |

### Bookings (`bookingService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| fetchBookings | userId | Booking[] | Get all bookings for user |
| createBooking | data | Booking | Create new booking |

### Sessions (`sessionService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| fetchSessionsByRole | role, userId | Session[] | Get sessions by role |
| fetchSessionById | id | Session | Get single session |
| createSession | data | Session | Create new session |
| updateSession | id, data | Session | Update session |
| checkConflicts | mentorId, start, end | Session[] | Check for time conflicts |

### Events (`eventService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| fetchEvents | filters | Event[] | Get events with filters |
| fetchEventById | id | Event | Get single event |
| createEvent | data | Event | Create new event |
| updateEvent | id, data | Event | Update event |
| deleteEvent | id | void | Delete event |
| registerForEvent | eventId, userId | void | Register attendee |
| checkInAttendee | eventId, userId | void | Check in attendee |
| submitFeedback | eventId, userId, data | void | Submit event feedback |
| addComment | eventId, userId, data | Comment | Add event comment |
| addSpeaker | eventId, data | Speaker | Add event speaker |
| addEventFile | eventId, data | EventFile | Add file to event |
| addToWaitlist | eventId, data | void | Add to waitlist |
| fetchEventStats | eventId | Stats | Get event statistics |
| fetchUserEvents | userId | Event[] | Get user's registered events |

### Messaging (`messageService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| fetchConversations | userId | Conversation[] | Get user's conversations |
| fetchMessages | conversationId | Message[] | Get messages in conversation |
| sendMessage | conversationId, data | Message | Send message |
| createConversation | data | Conversation | Create new conversation |
| markAsRead | conversationId, userId | void | Mark messages as read |
| pinConversation | id, pinned | void | Pin/unpin conversation |
| archiveConversation | id, archived | void | Archive/unarchive |
| searchConversations | userId, query | Conversation[] | Search conversations |
| uploadFile | file, conversationId | File | Upload file to conversation |

### Resources (`resourceService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| fetchResources | filters | Resource[] | Get resources with filters |
| fetchResourceById | id | Resource | Get single resource |
| createResource | data | Resource | Create new resource |
| updateResource | id, data | Resource | Update resource |
| deleteResource | id | void | Delete resource |
| fetchCategories | - | Category[] | Get resource categories |
| createCategory | data | Category | Create category |
| updateCategory | id, data | Category | Update category |
| addComment | resourceId, data | Comment | Add comment to resource |
| toggleFavorite | resourceId | void | Toggle favorite |
| assignToStudent | resourceId, studentId | void | Assign resource |
| assignToProgram | resourceId, programId | void | Assign to program |
| trackView | resourceId | void | Track resource view |
| trackDownload | resourceId | void | Track resource download |
| fetchVersions | resourceId | Version[] | Get version history |
| createVersion | resourceId, data | Version | Create new version |
| fetchAnalytics | resourceId | Analytics | Get resource analytics |

### Notifications (`notificationService.ts`, `notificationStorage.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| fetchNotifications | userId | Notification[] | Get user's notifications |
| markAsRead | id | void | Mark notification as read |
| markAllAsRead | userId | void | Mark all as read |
| getUnreadCount | userId | number | Get unread count |
| deleteNotification | id | void | Delete notification |

### Storage (`storageService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| upload | bucket, path, file | { path } | Upload file with compression |
| getPublicUrl | bucket, path | { publicUrl } | Get public URL |
| getSignedUrl | bucket, path | { signedUrl } | Get signed URL (private buckets) |
| delete | bucket, path | void | Delete file |
| list | bucket, path | FileList[] | List files in path |

### Edge Functions (`edgeFunctionService.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| gemini | { prompt, type, context } | GeminiResponse | AI chat/completion |
| sendEmail | { to, template, data } | EmailResponse | Send transactional email |
| scheduleSessionReminder | { task } | ScheduledResponse | Invoke scheduled task |

### AI (`aiProvider.ts`)
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| generate | { prompt, context, type } | string | AI text generation |
| generateStream | { prompt, context, type } | ReadableStream | Streaming text generation |

### Realtime Hooks (`useRealtimeData.ts`, `useRealtime.ts`)
| Method | Parameters | Description |
|--------|-----------|-------------|
| useSharedRealtimeData | table, queryKey | Subscribe to table changes, auto-invalidate query |
| useSharedSubscription | table, callback | Subscribe with custom callback |
