# Provisioning Audit — Complete Flow Analysis

**Date:** 2026-07-06
**Phase:** 3 — Transactional Provisioning Engine
**Status:** Complete

---

## Every Operation Executed (Approval Time)

| # | Operation | Type | Table | Data Written |
|---|-----------|------|-------|-------------|
| 1 | Verify JWT | Auth check | — | — |
| 2 | Fetch application | DB read | `applications` | — |
| 3 | Idempotency check (status check) | DB read | `applications` | — |
| 4 | Mentor authorization | Logic | — | — |
| 5 | Generate temp password | In-memory | — | — |
| 6 | Create auth user | Auth API | `auth.users` | email, password, user_metadata |
| 7 | Upsert profile | DB write | `profiles` | id, email, name, role, mentor_id, status, metrics |
| 8 | Update application | DB write | `applications` | status→'invited', user_id, mentor_id |
| 9a | Update profile (program_id) | DB write | `profiles` | program_id, specialization |
| 9b | Create student_progress | DB write | `student_progress` | user_id, program_id, started_at |
| 9c | Create dashboard_layout | DB write | `dashboard_layouts` | user_id, layout |
| 9d | Create timeline event (x2) | DB write | `student_timeline_events` | type, title, description, timestamp |
| 9e | Create goals (x2) | DB write | `goals` | title, description, status |
| 9f | Create conversation | DB write | `conversations` | mentor_id, student_id |
| 9g | Create participants (x2) | DB write | `conversation_participants` | conversation_id, user_id |
| 9h | Log analytics event | DB write | `analytics_events` | event_type, properties |
| 10 | Send welcome email | Ext API | Resend API | to, subject, html body |

**Total DB writes per approval:** 12 (1 auth + 11 public schema)
**Total external API calls:** 1 (Resend)

---

## Every Database Table Touched

| Table | Read | Write | Write Type |
|-------|------|-------|-----------|
| `auth.users` | — | Yes | INSERT (via admin SDK) |
| `public.applications` | Yes | Yes | SELECT + UPDATE |
| `public.profiles` | Yes | Yes | UPSERT |
| `public.student_progress` | Yes | Yes | SELECT + INSERT |
| `public.dashboard_layouts` | Yes | Yes | SELECT + INSERT |
| `public.student_timeline_events` | — | Yes | INSERT (x2) |
| `public.goals` | Yes | Yes | SELECT + INSERT (x2) |
| `public.conversations` | Yes | Yes | SELECT + INSERT |
| `public.conversation_participants` | — | Yes | INSERT (x2) |
| `public.analytics_events` | — | Yes | INSERT |
| `public.provisioning_jobs` | — | — | NEW (Phase 3) |
| `public.provisioning_audit_logs` | — | — | NEW (Phase 3) |

---

## External Dependencies

| Dependency | Type | Reliability | Failure Mode |
|-----------|------|-------------|-------------|
| Supabase Auth API (`admin.createUser`) | Internal API | High | Network error, email conflict |
| Resend API (`api.resend.com`) | External HTTP | Medium | Network, rate limit, quota |
| Supabase DB (all queries) | Internal | High | Connection, timeout, constraint |

---

## Every Possible Failure Point

| # | Step | Failure Type | Current Handling | Risk |
|---|------|-------------|-----------------|------|
| 1 | JWT verification | Invalid/expired token | Returns 401 | LOW |
| 2 | Fetch application | DB connection error | Returns 500 with rollback | **MEDIUM** |
| 3 | Idempotency check | State mismatch | Returns ALREADY_PROCESSED | LOW |
| 4 | Mentor authorization | Wrong mentor | Returns 403 | LOW |
| 5 | Password generation | Crypto failure | Improbable | LOW |
| 6 | Create auth user | Email exists | Returns 500 with rollback | **MEDIUM** |
| 6 | Create auth user | Network timeout | Returns 500 → user may exist | **HIGH** |
| 7 | Create profile | DB constraint | Returns 500 with rollback | MEDIUM |
| 8 | Update application | DB error | Returns 500 with rollback | MEDIUM |
| 9a-h | CRM init | DB error | Returns 500 with rollback | MEDIUM |
| 10 | Send email | API down | Silently skipped | **MEDIUM** |
| Any | Unexpected error | Any | Catch → rollback all | MEDIUM |

---

## Orphan Record Scenarios (Race Conditions)

| Scenario | Risk | Impact |
|----------|------|--------|
| Auth user created, profile fails → auth user deleted | LOW | Deletion succeeds (best-effort) |
| Auth user created, network timeout → client retries → 2 auth users | **HIGH** | Duplicate users for same email (handled by Phase 3 idempotency) |
| Profile created, application update fails → rollback deletes profile + auth | **MEDIUM** | Rollback is best-effort — may leave orphan profile |
| CRM partially created, failure → rollback deletes known records | **MEDIUM** | New CRM features may be missed by rollback |
| Email sent, then timeout → client sees error → student has account + email | **MEDIUM** | Student can log in; duplicate email is annoying but not dangerous |

---

## Current Response Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `ALREADY_PROCESSED` | Application already approved/invited | 200 |
| `AUTH_CREATE_FAILED` | Auth user creation failed | 500 |
| `PROFILE_CREATE_FAILED` | Profile upsert failed | 500 |
| `APPLICATION_UPDATE_FAILED` | Application status update failed | 500 |
| `CRM_INIT_FAILED` | CRM initialization failed | 500 |
| `CONFIG_ERROR` | Server not configured | 500 |
| `INVALID_INPUT` | Invalid JSON body | 400 |
| `MISSING_FIELD` | applicationId missing | 400 |
| `NOT_FOUND` | Application not found | 404 |
| `FORBIDDEN` | Not authorized for this application | 403 |
| `UNEXPECTED_ERROR` | Unknown error | 500 |

---

## Performance Metrics (estimated)

| Metric | Value |
|--------|-------|
| Total DB round-trips (success) | ~18 (SELECTs + INSERTs + UPDATEs) |
| Total API calls | 1 (Resend) |
| Estimated P50 duration | 800-1200ms |
| Estimated P99 duration | 3000-5000ms |
| Auth user creation | ~200-400ms |
| Email sending | ~300-800ms |
| All DB operations | ~200-400ms |

---

## Requirements for Phase 3

1. **Idempotency key** — every request must carry one; duplicate keys return cached result
2. **State machine** — track every step; know exactly where to resume or roll back from
3. **Transactional provisioning_jobs table** — persistent status with start/end time, step, error info
4. **Compensating actions** — reverse each step in order; no orphan records
5. **Retry engine** — retry only retryable failures (network, timeout, email); never retry validation
6. **Structured audit log** — every state transition recorded with timing
7. **Monitoring data** — success rate, failure rate, average duration, retries, rollbacks
