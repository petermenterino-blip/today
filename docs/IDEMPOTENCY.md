# Idempotency Design

**Date:** 2026-07-06
**Phase:** 3

---

## Principle

Every approval request contains an `idempotencyKey`. If the same key is submitted multiple times, the system returns the existing result — never creating duplicate users or records.

## Key Generation

Generated client-side when `ENABLE_TRANSACTIONAL_PROVISIONING` is enabled:

```
idempotencyKey = `${applicationId}_${Date.now()}`
```

The timestamp ensures each approval attempt gets a unique key. If the same key is retried (e.g., after a timeout), the system returns the cached result.

## Enforcement

The `provisioning_jobs` table enforces idempotency at the database level:

```sql
unique(application_id, idempotency_key)
```

## Flow

```
Client                                                    Edge Function
  │                                                             │
  ├─ POST /approve-application ────────────────────────────────→│
  │   { applicationId: "abc", idempotencyKey: "abc_123" }      │
  │                                                             │
  │                                              ┌──────────────┴──────────────┐
  │                                              │ query provisioning_jobs     │
  │                                              │ WHERE application_id = 'abc'│
  │                                              │ ORDER BY created_at DESC    │
  │                                              │ LIMIT 1                     │
  │                                              └──────────────┬──────────────┘
  │                                                             │
  │                    ┌────────────────────────────────────────┘
  │                    │
  │                    ├─ No existing job → create new job → process
  │                    │
  │                    ├─ Existing job, same key, completed:
  │                    │  → Return cached result (ALREADY_PROCESSED)
  │                    │
  │                    ├─ Existing job, same key, running:
  │                    │  → Return 409 IN_PROGRESS
  │                    │
  │                    ├─ Existing job, same key, failed/rolled_back:
  │                    │  → Check retry count
  │                    │     ├─ Under limit → retry (increment retry_count)
  │                    │     └─ Over limit  → 429 MAX_RETRIES_EXCEEDED
  │                    │
  │                    └─ Existing job, DIFFERENT key, completed:
  │                     → Return 409 (application already provisioned)
```

## Duplicate Prevention

| Scenario | Prevents |
|----------|----------|
| Mentor double-clicks approve | `idempotencyKey` check returns ALREADY_PROCESSED |
| Network timeout → client retries | Same key → returns existing result |
| Two mentors approve same app concurrently | `unique(application_id, idempotency_key)` constraint |
| Retry after rollback | New `idempotencyKey` → new job, old data cleaned |
| Same application, different key | Blocked if completed; allowed if failed |

## Non-Idempotent Operations

Edge Function operations are idempotent by design:

| Operation | Idempotency Mechanism |
|-----------|----------------------|
| Auth user creation | `email_confirm: true` + duplicate email check |
| Profile upsert | Uses `upsert()` — replaces if exists |
| Application update | Idempotent update |
| Student progress insert | Checks `if not exists` |
| Dashboard layout insert | Checks `if not exists` |
| Goals insert | Checks `if not exists` |
| Conversation insert | Checks `if not exists` |
| Email send | Non-critical — may send twice (acceptable) |
