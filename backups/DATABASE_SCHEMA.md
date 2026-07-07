# Database Schema Documentation

**Platform:** Supabase (PostgreSQL)
**Project Ref:** jnazlfhhzxrocvxvmkkc
**Total Tables:** ~45 public tables + auth schema tables

## Core Tables

### profiles
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| email | text | |
| name | text | |
| role | text | CHECK: student/mentor/admin |
| avatar_url | text | |
| phone | text | |
| bio | text | |
| specialization | text | |
| current_status | text | |
| linkedin_url | text | |
| resume_link | text | |
| status | text | CHECK: applied/active/at_risk/completed/alumni |
| health_status | text | CHECK: active/needs_attention/at_risk |
| growth_score | numeric | DEFAULT 0 |
| goal_progress | numeric | DEFAULT 0 |
| notes | text | |
| last_login | timestamptz | |
| application_status | text | CHECK: pending/approved/rejected |
| username | text | (added in 013) |
| settings | jsonb | (added in 013) |
| metrics | jsonb | DEFAULT {attendanceRate, goalCompletionRate, activityLevel} |
| tags | text[] | DEFAULT '{}' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

*Indexes: role, status*

### programs
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| mentor_id | uuid | FK → profiles(id) |
| title | text | NOT NULL |
| description | text | |
| duration | text | |
| category | text | |
| difficulty | text | CHECK: Beginner/Intermediate/Advanced |
| image | text | |
| status | text | CHECK: active/completed/not_started/draft/published |
| visibility | text | CHECK: public/private |
| progress | numeric | DEFAULT 0 |
| student_count | integer | DEFAULT 0 |
| max_students | integer | |
| outcomes | jsonb | DEFAULT '[]' |
| skills_covered | jsonb | DEFAULT '[]' |
| prerequisites | jsonb | DEFAULT '[]' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: mentor_id, status*

### program_enrollments
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| program_id | uuid | FK → programs(id) |
| student_id | uuid | FK → profiles(id) |
| status | text | CHECK: active/completed/dropped |
| enrolled_at | timestamptz | DEFAULT now() |
| completed_at | timestamptz | |
| UNIQUE(program_id, student_id) | | |

*Indexes: student_id, program_id*

### sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| mentor_id | uuid | FK → profiles(id) |
| student_id | uuid | FK → profiles(id) |
| program_id | uuid | FK → programs(id) |
| title | text | NOT NULL |
| description | text | |
| start_time | timestamptz | NOT NULL |
| end_time | timestamptz | NOT NULL |
| timezone | text | DEFAULT America/New_York |
| meeting_url | text | |
| recording_url | text | |
| meeting_type | text | CHECK: Google Meet/Zoom/Offline |
| session_type | text | |
| attendance_status | text | CHECK: attended/missed/late/pending |
| status | text | CHECK: scheduled/cancelled/completed |
| notes | text | |
| internal_notes | text | |
| recurring_session | boolean | DEFAULT false |
| reminder_time | timestamptz | |
| attached_files | text | |
| duration | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: mentor_id, student_id, start_time*

### goals
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | FK → profiles(id) |
| title | text | NOT NULL |
| description | text | |
| progress_percentage | numeric | 0-100 |
| status | text | CHECK: not_started/in_progress/at_risk/completed |
| blockers | text | |
| notes | text | |
| target_date | date | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: student_id, status*

### goal_milestones
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| goal_id | uuid | FK → goals(id) |
| title | text | NOT NULL |
| completed | boolean | DEFAULT false |
| created_at | timestamptz | DEFAULT now() |

*Indexes: goal_id*

### tasks
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | FK → profiles(id) |
| mentor_id | uuid | FK → profiles(id) |
| title | text | NOT NULL |
| description | text | |
| due_date | timestamptz | |
| priority | text | CHECK: low/medium/high |
| status | text | CHECK: pending/in_progress/submitted/completed/reviewed/approved/rejected |
| file_url | text | |
| feedback | text | |
| mentor_response | text | |
| growth_fields | jsonb | DEFAULT '{}' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: student_id, mentor_id, status*

### journals
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | FK → profiles(id) |
| type | text | CHECK: daily/weekly/learning |
| content | text | NOT NULL |
| mood | text | CHECK: great/good/okay/bad/terrible |
| wins | jsonb | DEFAULT '[]' |
| challenges | jsonb | DEFAULT '[]' |
| mentor_comments | jsonb | DEFAULT '[]' |
| reviewed_by_mentor | boolean | DEFAULT false |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: student_id, created_at*

### bookings
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles(id) |
| program_id | uuid | FK → programs(id) |
| user_name | text | |
| date | text | |
| time | text | |
| type | text | |
| status | text | CHECK: confirmed/cancelled/upcoming/completed |
| meeting_link | text | |
| notes | text | |
| attendance | text | CHECK: present/absent/excused |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: user_id, status*

### conversations
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | FK → profiles(id) |
| mentor_id | uuid | FK → profiles(id) |
| student_name | text | |
| is_group | boolean | DEFAULT false |
| name | text | |
| description | text | |
| admin_id | uuid | FK → profiles(id) |
| last_message | text | |
| last_message_time | timestamptz | |
| unread_count | integer | DEFAULT 0 |
| pinned | boolean | DEFAULT false |
| archived | boolean | DEFAULT false |
| participants | uuid[] | DEFAULT '{}' |
| mentor_name | text | (added in 030) |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: mentor_id, student_id*

### conversation_participants
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations(id) |
| user_id | uuid | FK → profiles(id) |
| joined_at | timestamptz | DEFAULT now() |
| UNIQUE(conversation_id, user_id) | | |

*Indexes: user_id*

### messages
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| sender_id | uuid | FK → profiles(id) |
| sender_name | text | |
| conversation_id | uuid | FK → conversations(id) |
| content | text | NOT NULL |
| type | text | CHECK: text/image/file/voice/system |
| status | text | CHECK: sent/delivered/read |
| audio_url | text | |
| duration | numeric | |
| file_name | text | (added in 030) |
| file_url | text | (added in 030) |
| file_size | bigint | DEFAULT 0 (added in 030) |
| file_type | text | (added in 030) |
| created_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: conversation_id, sender_id, created_at*

### events
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| title | text | NOT NULL |
| description | text | |
| date | text | NOT NULL |
| time | text | |
| end_time | text | |
| timezone | text | DEFAULT America/New_York |
| location | text | |
| meeting_link | text | |
| venue | text | |
| image | text | |
| cover_image | text | |
| capacity | integer | |
| registration_deadline | text | |
| speaker | text | |
| visibility | text | CHECK: public/private |
| status | text | CHECK: draft/published/cancelled/completed |
| tags | text | |
| category | text | |
| duration | text | |
| waitlist_limit | integer | |
| requirements | text | |
| resource_files | text | |
| event_color | text | |
| created_by | uuid | FK → profiles(id) |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: date, status*

### event_attendees
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| event_id | uuid | FK → events(id) |
| user_id | uuid | FK → profiles(id) |
| name | text | |
| email | text | |
| program | text | |
| registration_status | text | CHECK: confirmed/pending/cancelled |
| attendance_status | text | CHECK: none/attended/absent |
| registered_at | timestamptz | DEFAULT now() |
| UNIQUE(event_id, user_id) | | |

*Indexes: event_id*

### applications
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles(id) |
| email | text | NOT NULL |
| first_name | text | NOT NULL |
| last_name | text | NOT NULL |
| phone_number | text | |
| discipline | text | |
| reason_for_applying | jsonb | |
| status | text | CHECK: pending_review/approved/rejected/more_info_needed/invited |
| mentor_type | text | |
| meeting_preference | text | CHECK: Virtual/In-Person/Hybrid |
| frequency | text | |
| seriousness | integer | 1-10 |
| location | text | |
| focus_area | text | |
| program_id | uuid | FK → programs(id) |
| role_selected | text | |
| top_strength | text | |
| needs_focus | text | |
| mentor_notes | text | |
| rejection_reason | text | |
| feedback | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: user_id, status, email*

### notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles(id) |
| title | text | NOT NULL |
| message | text | NOT NULL |
| read | boolean | DEFAULT false |
| type | text | CHECK: session/task/goal/system/journal/review/announcement |
| link | text | |
| created_at | timestamptz | DEFAULT now() |
| deleted_at | timestamptz | |

*Indexes: user_id, (user_id, read), created_at*

## Complete Table List

| # | Table | Migration | Purpose |
|---|-------|-----------|---------|
| 1 | profiles | 001 | User profiles extending auth.users |
| 2 | programs | 002 | Mentorship program definitions |
| 3 | program_enrollments | 002 | Student-program enrollment |
| 4 | sessions | 003 | Mentoring sessions |
| 5 | goals | 004 | Student goals |
| 6 | goal_milestones | 004 | Goal milestones |
| 7 | tasks | 005 | Tasks/action items |
| 8 | journals | 006 | Journal entries |
| 9 | bookings | 007 | Session bookings |
| 10 | conversations | 008 | Messaging conversations |
| 11 | conversation_participants | 008 | Conversation participants |
| 12 | messages | 008 | Messages |
| 13 | events | 009 | Events |
| 14 | event_attendees | 009 | Event attendees |
| 15 | event_files | 009 | Event files |
| 16 | event_feedbacks | 009 | Event feedbacks |
| 17 | event_recordings | 009 | Event recordings |
| 18 | applications | 010 | Mentorship applications |
| 19 | application_notes | 010 | Application notes |
| 20 | application_info_requests | 010 | Info requests for applications |
| 21 | notifications | 011 | User notifications |
| 22 | tags | 012 | Labels/tags |
| 23 | student_tags | 012 | Student-tag mapping |
| 24 | resources | 012 | Resource library |
| 25 | student_progress | 012 | Program progress |
| 26 | student_timeline_events | 012 | Timeline events |
| 27 | mentor_settings | 012 | Mentor preferences |
| 28 | dashboard_layouts | 012 | Dashboard widget layouts |
| 29 | custom_forms | 012 | Custom form definitions |
| 30 | form_templates | 012 | Form templates |
| 31 | form_submissions | 012 | Form submissions |
| 32 | shared_files | 012 | Shared files |
| 33 | mentor_availability | 012 | Mentor availability |
| 34 | products | 012 | Store products |
| 35 | transactions | 012 | Purchase transactions |
| 36 | announcements | 012 | Announcements |
| 37 | ai_chat_history | 012 | AI chat history |
| 38 | surveys | 012 | Surveys |
| 39 | survey_responses | 012 | Survey responses |
| 40 | analytics_events | 012 | Analytics tracking |
| 41 | visitor_bookings | 018 | Visitor booking requests |
| 42 | resource_categories | 023_resources | Resource categories |
| 43 | resource_tags | 023_resources | Resource-tag mapping |
| 44 | resource_assignments | 023_resources | Resource assignments |
| 45 | resource_views | 023_resources | Resource views tracking |
| 46 | resource_downloads | 023_resources | Resource downloads |
| 47 | resource_favorites | 023_resources | Resource favorites |
| 48 | resource_comments | 023_resources | Resource comments |
| 49 | resource_versions | 023_resources | Resource version history |
| 50 | resource_activity | 023_resources | Resource activity log |
| 51 | reviews | 023_reviews | Review system |
| 52 | review_history | 023_reviews | Review status history |
| 53 | resource_completions | 026 | Resource completions |
| 54 | recently_viewed | 026 | Recently viewed resources |
| 55 | gallery_items | 028_gallery | Gallery items |
| 56 | gallery_activity_log | 028_gallery | Gallery activity |
| 57 | booking_notes | 028_visitor_bookings | Visitor booking notes |
| 58 | booking_timeline | 028_visitor_bookings | Booking timeline |
| 59 | social_links | 029 | Social media links |
| 60 | website_settings | 029 | Public website settings |
| 61 | form_assignments | 030_crm_module5 | Form assignments |

## Foreign Key Relationships

```
profiles.id ─────────────────────────────────────────────────────────────────────────┐
    │                                                                                 │
    ├─ programs.mentor_id                                                             │
    ├─ program_enrollments.student_id                                                 │
    ├─ sessions.mentor_id, sessions.student_id                                        │
    ├─ goals.student_id                                                               │
    ├─ tasks.student_id, tasks.mentor_id                                              │
    ├─ journals.student_id                                                            │
    ├─ bookings.user_id                                                               │
    ├─ conversations.mentor_id, conversations.student_id                               │
    ├─ conversation_participants.user_id                                              │
    ├─ messages.sender_id                                                             │
    ├─ events.created_by                                                              │
    ├─ applications.user_id                                                           │
    ├─ notifications.user_id                                                          │
    ├─ student_tags.student_id → profiles(id)                                         │
    ├─ tags.id → student_tags.tag_id                                                  │
    ├─ resources.created_by                                                           │
    ├─ student_progress.user_id, student_progress.program_id                          │
    ├─ student_timeline_events.student_id                                             │
    ├─ mentor_settings.mentor_id                                                      │
    ├─ dashboard_layouts.user_id                                                      │
    ├─ custom_forms.created_by                                                        │
    ├─ form_templates.created_by                                                      │
    ├─ form_submissions.user_id, form_submissions.student_id                          │
    ├─ shared_files.user_id                                                           │
    ├─ mentor_availability.mentor_id                                                  │
    ├─ transactions.user_id                                                           │
    ├─ announcements.created_by                                                       │
    ├─ ai_chat_history.user_id                                                        │
    ├─ surveys.created_by                                                             │
    ├─ survey_responses.user_id, survey_responses.survey_id                           │
    ├─ analytics_events.user_id                                                       │
    ├─ event_attendees.user_id                                                        │
    ├─ event_feedbacks.user_id                                                        │
    ├─ application_notes.author_id                                                    │
    ├─ application_info_requests.application_id                                        │
    │                                                                                 │
programs.id ──────────────────────────────────────────────────────────────────────────┐
    ├─ program_enrollments.program_id                                                 │
    ├─ sessions.program_id                                                            │
    ├─ bookings.program_id                                                            │
    ├─ applications.program_id                                                        │
    ├─ student_progress.program_id                                                    │
    ├─ resource_assignments.program_id                                                │
    ├─ reviews.program_id                                                             │
    │                                                                                 │
goals.id ── goal_milestones.goal_id                                                   │
events.id ── event_attendees.event_id, event_files.event_id,                          │
             event_feedbacks.event_id, event_recordings.event_id                       │
applications.id ── application_notes.application_id,                                  │
                   application_info_requests.application_id                             │
resources.id ── resource_categories.parent_id, resource_tags.resource_id,              │
                resource_assignments.resource_id, resource_views.resource_id,           │
                resource_downloads.resource_id, resource_favorites.resource_id,         │
                resource_comments.resource_id, resource_versions.resource_id,           │
                resource_activity.resource_id                                           │
reviews.id ── review_history.review_id                                                 │
resource_categories.id ── resource_categories.parent_id                                │
resource_comments.id ── resource_comments.parent_id                                    │
```

## Key Indexes

- All primary keys have default btree indexes
- Foreign keys are indexed where performance matters
- Composite indexes: notifications(user_id, read), reviews(source_type, source_id)
- Descending indexes: journals(created_at desc), messages(created_at desc), reviews(created_at desc), analytics_events(created_at desc), idx_notifications_created(created_at desc)
