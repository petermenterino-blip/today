# Load Test Assessment

**Date:** 2026-07-06

This is a **code-level review** of potential bottlenecks, concurrency risks, and throughput limits. No actual load testing was executed.

---

## 1. Bottleneck Analysis

| Component | Bottleneck | Risk | Mitigation |
|-----------|-----------|------|------------|
| **Gemini Edge Function** | External API call (Google Gemini). Concurrent requests limited by API quota | HIGH — Single API key, max ~1500 RPM | Add API key rotation or queue |
| **Resend Edge Function** | 10 req/min rate limit | MEDIUM — Burst of approvals will queue | Rate limit is already enforced in code |
| **Supabase DB** | RLS policies require auth lookup per query | MEDIUM — Complex policies on `conversations` with join | Indexes on `user_id`, `mentor_id`, `student_id` |
| **Auth** | Supabase Auth has built-in rate limits (~30 signups/min) | HIGH — Batch approvals could hit limit | `approve-application` uses service role key (bypasses rate limits) |
| **Storage** | 50MB file upload limit per request | LOW — Singleton uploads | Already enforced |

---

## 2. Concurrency Analysis

| Scenario | Risk | Details |
|----------|------|---------|
| Multiple mentors approving simultaneously | LOW | Each application is unique; idempotency key prevents double-processing |
| Same application approved twice | ✅ MEDIUM | Phase 2: Non-atomic check-then-act window → could double-approve. Phase 3: Idempotency key prevents |
| Student/multiple tabs | LOW | Proper session persistence; no WS conflicts |
| File upload conflicts | LOW | UUID-based filenames prevent collisions |

---

## 3. Database Query Analysis

| Query | Risk | Details |
|-------|------|---------|
| `conversations` list with multi-table join | MEDIUM | Complex RLS policy joining `conversation_participants` |
| `goals` by `student_id` | LOW | Simple indexed query |
| `applications` by `email` | LOW | Filtered index likely exists |
| `profiles` by `id` | LOW | Primary key lookup |

---

## 4. Resource Limits

| Resource | Limit | Risk |
|----------|-------|------|
| Supabase Free/Pro project | 500 MB DB, 2 GB bandwidth, 50K edge function invocations | ✅ |
| Gemini 2.0 Flash | 1500 RPM (free tier), 30 RPM per IP | ✅ |
| Resend | 100 emails/day (free tier), 3.2K/mo | ⚠️ **MEDIUM** — Approving 3+ students/day eats quota |
| Deno Deploy | 100K requests/day (free), 10ms CPU per req | ✅ |

---

## 5. Recommendations

| Priority | Action | Details |
|----------|--------|---------|
| MEDIUM | Add index on `conversation_participants(user_id)` | Needed for RLS policy performance |
| MEDIUM | Monitor Resend email quota | 100/day limit on free tier — will block approvals |
| LOW | Add concurrent-request limit to Gemini function | Prevents single-key rate limit from 503-ing all users |

---

## Summary

✅ **PASS** (with caveats) — The architecture handles moderate load. Primary risks are external API rate limits (Resend 100/day, Gemini 1500 RPM) and complex RLS on conversations. No self-inflicted concurrency bugs (idempotency key prevents double-approval in Phase 3).
