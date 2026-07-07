# RLS Policy Documentation

**Date:** 2026-07-06  
**Purpose:** Authoritative reference for all Row-Level Security policies across the Mentorino
database. Policies are documented in functional groups with rationale.

---

## Policy Conventions

| Convention | Meaning |
|------------|---------|
| `public.is_mentor()` | JWT-based check: `request.jwt.claims.user_metadata.role = 'mentor'` |
| ~~`public.is_admin()`~~ | ~~Removed in migration 038 (admin role eliminated)~~ |
| `auth.uid()` | Supabase function returning the authenticated user's UUID |
| `auth.role()` | Supabase function returning the user's role (`'authenticated'` or `'anon'`) |
| `FOR ALL` | Shorthand for `FOR SELECT, INSERT, UPDATE, DELETE` |

---

## 1. Profiles & Mentorship

### `profiles`
| Policy Name | Operation | Scope | Rationale |
|-------------|-----------|-------|-----------|
| Users can read own profile | SELECT | `auth.uid() = id` | Privacy: users see only their own profile |
| Mentors can read assigned students | SELECT | `public.is_mentor()` | Mentors need to see student profiles in their CRM dashboard |
| Users can update own profile | UPDATE | `auth.uid() = id` | Self-service profile editing |
| Mentors can update students they mentor | UPDATE | `public.is_mentor() AND mentor_id = auth.uid()` | Mentors update only their direct mentees |
| Users can insert own profile | INSERT | `auth.uid() = id` | Self-registration |
| ~~Mentors full access to profiles~~ | ~~ALL~~ | ~~Removed in 038~~ | ~~No longer needed~~ |

**Key design decision:** The mentor SELECT policy does NOT restrict to assigned students
— mentors see all student profiles. This matches the CRM requirement where mentors
browse all students. The UPDATE policy IS scoped to `mentor_id`.

---

## 2. Programs & Enrollments

### `programs`
| Policy Name | Operation | Scope | Rationale |
|-------------|-----------|-------|-----------|
| Anyone can read published programs | SELECT | `visibility = 'public' AND status = 'published'` | Public program catalog |
| Mentors can read their own programs | SELECT | `mentor_id = auth.uid()` | Mentor's program management |
| Mentors can insert/update/delete own programs | CUD | `mentor_id = auth.uid()` | Mentor owns their programs |

### `program_enrollments`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Students can read own enrollments | SELECT | `student_id = auth.uid()` |
| Mentors can read enrollments for their programs | SELECT | `EXISTS (SELECT 1 FROM programs WHERE id = program_id AND mentor_id = auth.uid())` |
| Students can enroll themselves | INSERT | `student_id = auth.uid()` |
| Mentors can update enrollments | UPDATE | Same EXISTS check as SELECT |

---

## 3. Sessions

### `sessions`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Participants can read sessions | SELECT | `student_id = auth.uid() OR mentor_id = auth.uid()` |
| Mentors can insert sessions | INSERT | `mentor_id = auth.uid()` |
| Mentors can update sessions | UPDATE | `mentor_id = auth.uid()` |
| Students can update attendance | UPDATE | `student_id = auth.uid()` |
| Mentors can delete sessions | DELETE | `mentor_id = auth.uid()` |

---

## 4. Goals & Milestones

### `goals`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Students can read own goals | SELECT | `student_id = auth.uid()` |
| Mentors can read students goals | SELECT | `EXISTS (SELECT 1 FROM profiles WHERE id = student_id AND mentor_id = auth.uid())` |
| Students can insert/update own goals | INSERT/UPDATE | `student_id = auth.uid()` |
| Mentors can update students goals | UPDATE | `EXISTS (SELECT 1 FROM profiles WHERE id = student_id AND mentor_id = auth.uid())` |

### `goal_milestones`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Goal milestones inherit goal policies | SELECT | `EXISTS (SELECT 1 FROM goals WHERE id = goal_id)` |
| Students can manage own milestones | INSERT | `EXISTS (SELECT 1 FROM goals WHERE id = goal_id AND student_id = auth.uid())` |
| Mentors can manage milestones | INSERT | Join through goals → programs → mentor_id |

---

## 5. Messages & Conversations

### `conversations`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Participants can read conversations | SELECT | `mentor_id = auth.uid() OR student_id = auth.uid() OR user_id IN conversation_participants` |
| Mentors can create conversations | INSERT | `mentor_id = auth.uid()` |
| Participants can update conversations | UPDATE | Same as SELECT |
| Mentors can delete conversations | DELETE | `mentor_id = auth.uid()` |

### `conversation_participants`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can read own participant records | SELECT | `user_id = auth.uid()` |
| Mentors can add participants | INSERT | `EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND mentor_id = auth.uid())` |
| Mentors can remove participants | DELETE | Same EXISTS check |

### `messages`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Participants can read messages | SELECT | `EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())` |
| Participants can insert messages | INSERT | Same subquery |
| Users can update own messages | UPDATE | `sender_id = auth.uid()` |
| Participants can update message status | UPDATE | Same participant subquery (for read receipts) |

---

## 6. Resources

### `resources` (main table)
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Authenticated users can read resources | SELECT | `auth.role() = 'authenticated'` |
| Mentors can insert resources | INSERT | `public.is_mentor()` |
| Mentors can update resources | UPDATE | `public.is_mentor()` |
| Mentors can delete resources | DELETE | `public.is_mentor()` |

### Resource sub-tables (migration 035 hardened)

#### `resource_categories`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Anyone can read resource categories | SELECT | `auth.role() = 'authenticated'` |
| Mentors manage resource categories | INSERT | `public.is_mentor()` |
| Mentors update resource categories | UPDATE | `public.is_mentor()` |
| Mentors delete resource categories | DELETE | `public.is_mentor()` |

#### `resource_favorites`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read own favorites | SELECT | `auth.role() = 'authenticated'` (read-only, acceptable) |
| Users manage own favorites | INSERT | `user_id = auth.uid()` |
| Users update own favorites | UPDATE | `user_id = auth.uid()` |
| Users delete own favorites | DELETE | `user_id = auth.uid()` |

#### `resource_comments`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read comments | SELECT | `auth.role() = 'authenticated'` |
| Users create comments | INSERT | `user_id = auth.uid()` |
| Users update own comments | UPDATE | `user_id = auth.uid()` |
| Users delete own comments | DELETE | `user_id = auth.uid()` |

#### `resource_versions`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read versions | SELECT | `auth.role() = 'authenticated'` |
| Mentors create versions | INSERT | `public.is_mentor()` |

#### `resource_activity`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read activity | SELECT | `auth.role() = 'authenticated'` |
| Users insert activity | INSERT | `auth.role() = 'authenticated'` |

#### `resource_completions` *(new in 035)*
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Students insert own completions | INSERT | `user_id = auth.uid()` |
| Students read own completions | SELECT | `user_id = auth.uid()` |
| Mentors read completions | SELECT | `public.is_mentor() AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND mentor_id = auth.uid())` |

#### `resource_downloads`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can insert downloads | INSERT | `auth.role() = 'authenticated'` |
| Users can read downloads | SELECT | `auth.role() = 'authenticated'` |

#### `resource_assignments`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read own assignments | SELECT | `student_id = auth.uid() OR public.is_mentor()` |
| Mentors manage assignments | INSERT | `public.is_mentor()` |
| Mentors update assignments | UPDATE *(new in 035)* | `public.is_mentor()` |
| Mentors delete assignments | DELETE | `public.is_mentor()` |

#### `recently_viewed` *(new in 035)*
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read own recently viewed | SELECT | `user_id = auth.uid()` |
| Users insert own recently viewed | INSERT | `user_id = auth.uid()` |
| Users update own recently viewed | UPDATE | `user_id = auth.uid()` |
| Users delete own recently viewed | DELETE | `user_id = auth.uid()` |

#### `resource_tags`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Anyone can read resource tags | SELECT | `auth.role() = 'authenticated'` |
| Mentors manage resource tags | INSERT | `public.is_mentor()` |

#### `resource_views`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can insert views | INSERT | `auth.role() = 'authenticated'` |
| Users can read views | SELECT | `auth.role() = 'authenticated'` |

---

## 7. Reviews *(new in 035)*

### `reviews`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Students read own reviews | SELECT | `student_id = auth.uid()` |
| Mentors read reviews | SELECT | `mentor_id = auth.uid()` |
| Mentors insert reviews | INSERT | `mentor_id = auth.uid()` |
| Mentors update reviews | UPDATE | `mentor_id = auth.uid()` |
| Students respond to reviews | UPDATE | `student_id = auth.uid()` |
| Mentors delete reviews | DELETE | `mentor_id = auth.uid()` |

### `review_history`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Participants read review history | SELECT | `EXISTS (SELECT 1 FROM reviews WHERE id = review_id AND (student_id = auth.uid() OR mentor_id = auth.uid()))` |
| Participants insert review history | INSERT | Same review participant check |

---

## 8. Events

### `events` (main table)
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Anyone can read published events | SELECT | `visibility = 'public'` |
| Mentors can create events | INSERT | `public.is_mentor()` |
| Mentors can update own events | UPDATE | `created_by = auth.uid()` |

### Event child tables
All use `auth.role() = 'authenticated'` for SELECT (public event data) and
creator-scoped INSERT/UPDATE/DELETE.

---

## 9. CRM & Mentorship Tools

### `bookings`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can read own bookings | SELECT | `user_id = auth.uid()` |
| Mentors can read all bookings | SELECT | `public.is_mentor()` |
| Users can insert own bookings | INSERT | `user_id = auth.uid()` |
| Mentors can update bookings | UPDATE | `public.is_mentor()` |

### `shared_files` table
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can read own files | SELECT | `user_id = auth.uid()` |
| Mentors can read shared files | SELECT | `public.is_mentor() AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND mentor_id = auth.uid())` |
| Mentors can insert shared files | INSERT | `public.is_mentor()` |
| Mentors can update shared files | UPDATE | Same mentor-scoped SELECT check |
| Mentors can delete shared files | DELETE | Same mentor-scoped SELECT check |

### Storage: `shared_files` bucket
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| shared_files_mentor_assigned | ALL | `bucket_id = 'shared_files' AND public.is_mentor() AND EXISTS (SELECT 1 FROM profiles WHERE id = (storage.foldername(name))[1]::uuid AND mentor_id = auth.uid())` |
| shared_files_student_read | SELECT | `bucket_id = 'shared_files' AND (storage.foldername(name))[1] = auth.uid()::text` |

---

## 10. Applications

### `applications`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can read own applications | SELECT | `user_id = auth.uid()` |
| Mentors can read all applications | SELECT | `public.is_mentor()` |
| Anyone can submit application | INSERT | `WITH CHECK (true)` — intentional for public submissions |
| Mentors can update applications | UPDATE | `public.is_mentor()` |

### `application_notes`
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users can read own application notes | SELECT | `author_id = auth.uid()` |
| Users can create application notes | INSERT | `author_id = auth.uid()` |
| Users can update own application notes | UPDATE | `author_id = auth.uid()` |

### `application_info_requests` *(policies added in 035)*
| Policy Name | Operation | Scope |
|-------------|-----------|-------|
| Users read own info requests | SELECT | `user_id = auth.uid()` |
| Mentors read info requests | SELECT | `public.is_mentor()` |
| Users create info requests | INSERT | `user_id = auth.uid()` |
| Mentors update info requests | UPDATE | `public.is_mentor()` |

---

## 11. Helper Functions

### `public.is_mentor()`
```sql
SELECT coalesce(
  nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{user_metadata, role}', ''),
  nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata, role}', ''),
  ''
) = 'mentor';
```
Reads role from JWT claims. Does NOT query the profiles table, avoiding RLS recursion.

### ~~`public.is_admin()`~~ — REMOVED in migration 038
The admin role was eliminated. The function `is_admin()` was dropped.
All admin-override RLS policies were converted to mentor role checks or removed.

### Sync trigger: `sync_profile_role_to_auth()`
After INSERT or UPDATE of `profiles.role`, syncs the role to `auth.users.raw_user_meta_data`
so the JWT (signed from user_metadata) is always authoritative.
