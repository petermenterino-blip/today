# Recovery System

**Date:** 2026-07-06
**Phase:** 3

---

## Overview

The recovery system ensures the database is never left in an inconsistent state. If any step in the provisioning state machine fails, compensating actions are executed in reverse order to undo all completed work.

## Compensating Actions

Each step in the state machine has a corresponding compensating action:

| Step | Compensation | What It Does |
|------|-------------|--------------|
| `creating_conversations` | Delete conversations | Deletes conversation_participants + conversations for this student |
| `creating_goals` | Delete goals | Deletes all goals for this student |
| `initializing_crm` | Delete CRM records | Deletes student_progress, dashboard_layouts, timeline_events, analytics_events |
| `updating_application` | Restore application | Sets status → `pending_review`, user_id → null |
| `creating_profile` | Delete profile | Deletes profile by user_id |
| `creating_auth_user` | Delete auth user | `admin.deleteUser()` via auth admin API |

## Rollback Flow

```
1. Error detected at step "creating_goals"
2. Job status → "rolling_back"
3. Completed steps: [validating, creating_auth_user, creating_profile, updating_application, initializing_crm]
4. Compensating actions executed in reverse order:
   a. initializing_crm → delete CRM records
   b. updating_application → restore app status
   c. creating_profile → delete profile
   d. creating_auth_user → delete auth user
5. Application restored to pending_review
6. Job status → "rolled_back"
7. Audit log records every compensation
```

## Retry Flow

```
1. Error detected at step "sending_email" (network timeout)
2. Error is retryable (network error)
3. Job status → "retrying"
4. Client receives RETRYABLE_ERROR
5. Client resubmits same idempotencyKey
6. Job found, status=retrying, retry_count < max_retries
7. Job resumes from last failed step (sending_email)
8. On success → continues to completion
9. On repeated failure → max retries exhausted → rollback
```

## Retryable vs Non-Retryable Errors

### Retryable (retry up to MAX_RETRIES times)

| Error Pattern | Examples | Reason |
|--------------|----------|--------|
| Network errors | timeout, timed out, econnrefused, econnreset | Transient infrastructure issues |
| HTTP 5xx | 500, 502, 503, 504 | Temporary server errors |
| Rate limits | rate limit, too many requests | API throttling |
| DB connection | Connection failure | Transient DB issues |

### Non-Retryable (immediate rollback)

| Error Code | Examples | Reason |
|-----------|----------|--------|
| DUPLICATE_EMAIL | Email already exists | Validation failure |
| VALIDATION_ERROR | Invalid input | Will never succeed |
| NOT_FOUND | Application missing | Data integrity issue |
| FORBIDDEN | Not authorized | Permission issue |
| INVALID_INPUT | Bad request | Client error |

## Configurable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `MAX_RETRIES` | 3 | Maximum retry attempts per job |
| `RETRYABLE_ERROR_PATTERNS` | See code | Patterns that trigger retry |
| `NON_RETRYABLE_CODES` | See code | Codes that trigger immediate rollback |

## Recovery Scenarios

### Scenario 1: Auth user created, profile fails
```
Steps completed: [creating_auth_user]
Compensation: Delete auth user
Result: No orphan auth user
```

### Scenario 2: Auth user + profile created, application update fails
```
Steps completed: [creating_auth_user, creating_profile]
Compensation: Delete profile → delete auth user
Result: Application stays pending_review
```

### Scenario 3: Full CRM created, conversation creation fails
```
Steps completed: [creating_auth_user, creating_profile, updating_application, initializing_crm]
Compensation: Delete CRM → restore app → delete profile → delete auth user
Result: Full cleanup
```

### Scenario 4: Email sent, response lost (network timeout)
```
Steps completed: all except email marked complete
Email status: unknown (may have been sent or not)
Strategy: Student may receive duplicate email on retry;
         "Forgot Password" available as fallback
Result: Acceptable — no orphan data, student can recover
```

### Scenario 5: Concurrent mentor approvals
```
Two mentors submit for same application with different keys
First: creates job, starts processing
Second: finds existing job (completed) → returns ALREADY_PROCESSED
         or finds existing job (running) → returns IN_PROGRESS
         or finds existing job (failed) → starts new job
Result: Idempotent — no duplicates
```
