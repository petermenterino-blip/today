# Provisioning State Machine

**Date:** 2026-07-06
**Phase:** 3

---

## Diagram

```
                    ┌──────────────┐
                    │   PENDING    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  VALIDATING  │
                    │  ──────────  │
                    │ • Application│
                    │   exists?    │
                    │ • Mentor     │
                    │   authorized?│
                    └──────┬───────┘
                           │ success
                    ┌──────▼──────────┐
                    │CREATING_AUTH_USER│
                    │  ──────────────  │
                    │ admin.createUser │
                    └──────┬───────────┘
                           │ success
                    ┌──────▼──────────┐
                    │CREATING_PROFILE  │
                    │  ──────────────  │
                    │ profiles.upsert  │
                    └──────┬───────────┘
                           │ success
                    ┌──────▼────────────────┐
                    │UPDATING_APPLICATION    │
                    │  ──────────────────   │
                    │ status → 'invited'    │
                    │ user_id, mentor_id    │
                    └──────┬────────────────┘
                           │ success
                    ┌──────▼─────────────┐
                    │ INITIALIZING_CRM   │
                    │  ───────────────  │
                    │ • student_progress│
                    │ • dashboard_layout│
                    │ • timeline events │
                    │ • analytics_event │
                    └──────┬────────────┘
                           │ success
                    ┌──────▼──────────┐
                    │ CREATING_GOALS  │
                    │  ─────────────  │
                    │ 2 default goals │
                    └──────┬──────────┘
                           │ success
                    ┌──────▼────────────────┐
                    │CREATING_CONVERSATIONS │
                    │  ─────────────────── │
                    │ conversation + 2 parts│
                    └──────┬────────────────┘
                           │ success
                    ┌──────▼────────────┐
                    │  SENDING_EMAIL    │
                    │  ──────────────   │
                    │ Welcome via Resend│
                    └──────┬────────────┘
                           │ success
                    ┌──────▼──────────┐
                    │   COMPLETED     │
                    └─────────────────┘
```

## Failure Handling

Any step failure → two possible paths:

### 1. Retryable Error

```
                    ┌──────────────────┐
                    │   STEP FAILED    │
                    │  (network/timeout│
                    │   DB/API error)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  RETRY_CHECK     │
                    │  retry_count <   │
                    │  max_retries?    │
                    └────────┬─────────┘
                             │ yes
                    ┌────────▼─────────┐
                    │    RETRYING      │
                    │  status='retrying│
                    │  retry_count++   │
                    │  (client re-     │
                    │   submits with   │
                    │   same key)      │
                    └──────────────────┘
```

### 2. Non-Retryable or Exhausted Retries

```
                    ┌──────────────────┐
                    │   STEP FAILED    │
                    │  (validation/    │
                    │   max retries)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  ROLLBACK_START  │
                    │  status=         │
                    │  'rolling_back'  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────────────┐
                    │ COMPENSATING ACTIONS      │
                    │ (reverse order of steps)  │
                    │                           │
                    │ 1. Delete conversations   │
                    │ 2. Delete goals           │
                    │ 3. Delete CRM records     │
                    │ 4. Restore application    │
                    │ 5. Delete profile         │
                    │ 6. Delete auth user       │
                    └────────┬─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   ROLLED_BACK    │
                    │  status=         │
                    │  'rolled_back'   │
                    │  (manual retry   │
                    │   available)     │
                    └──────────────────┘
```

## Step Order and Mapping

| Order | Step | Function | DB Writes |
|-------|------|----------|-----------|
| 0 | `validating` | Input validation + auth | — |
| 1 | `creating_auth_user` | `admin.createUser()` | `auth.users` |
| 2 | `creating_profile` | `profiles.upsert()` | `profiles` |
| 3 | `updating_application` | status → `invited` | `applications` |
| 4 | `initializing_crm` | 5 sub-operations | 6 tables |
| 5 | `creating_goals` | 2 default goals | `goals` |
| 6 | `creating_conversations` | conversation + participants | 2 tables |
| 7 | `sending_email` | Resend API | External (non-blocking) |
| 8 | `completed` | Job marked complete | `provisioning_jobs` |

## State Transitions

| From | Event | To |
|------|-------|----|
| pending | start processing | running |
| running | step success → more steps | running (next step) |
| running | all steps complete | completed |
| running | retryable error, retries left | retrying |
| running | non-retryable error | rolling_back |
| rolling_back | all compensating actions done | rolled_back |
| retrying | client resubmits | running (from failed step) |
| failed | client resubmits with new key | running |
| rolled_back | client resubmits with new key | running |
