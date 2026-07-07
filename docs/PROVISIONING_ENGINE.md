# Provisioning Engine

**Date:** 2026-07-06
**Phase:** 3
**Status:** Implemented

---

## Architecture

The provisioning engine is a dual-mode system implemented in the `approve-application` Supabase Edge Function:

### Mode Selection

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Phase 2** (Legacy) | No `idempotencyKey` in request body | Simple sequential provisioning without state machine, retry, or audit logging |
| **Phase 3** (Transactional) | `idempotencyKey` present in request body | Full state machine with idempotency, compensating actions, retry engine, and audit logging |

### Feature Flag Flow

```
Browser                          Edge Function
  │                                    │
  ├─ ENABLE_TRANSACTIONAL_            │
  │  PROVISIONING = false              │
  │  → body: { applicationId }  ─────→│  → phase2Flow() (no state machine)
  │                                    │
  ├─ ENABLE_TRANSACTIONAL_            │
  │  PROVISIONING = true               │
  │  → body: { applicationId,         │
  │           idempotencyKey }  ─────→│  → phase3Flow() (state machine)
```

---

## Key Components

### 1. `provisioning_jobs` Table
Stores the state of every provisioning attempt:
- `id` — primary key
- `application_id` — FK to applications
- `idempotency_key` — unique per application
- `status` — pending, running, completed, failed, rolled_back, retrying
- `current_step` — which step in the state machine
- `retry_count` / `max_retries` — retry tracking
- `last_error` / `last_error_detail` — error diagnostics
- `start_time` / `end_time` / `execution_time_ms` — timing
- `result_data` — JSON blob with student_id, email, completed_steps

### 2. `provisioning_audit_logs` Table
Immutable audit trail for every state transition:
- `provisioning_job_id` — FK to job
- `request_id` — trace identifier
- `action` — what happened
- `step` — which state machine step
- `status` — started, completed, failed, rolled_back, retrying, skipped
- `duration_ms` — timing
- `metadata` — JSON blob with details

### 3. `provisioning_dashboard` View
Aggregated metrics for health monitoring:
- success_count, failure_count, running_count, retrying_count, pending_count
- avg_duration_ms, total_retries, total_rollbacks, recovered_jobs

---

## State Machine

See [STATE_MACHINE.md](STATE_MACHINE.md) for complete state machine design.

## Idempotency

See [IDEMPOTENCY.md](IDEMPOTENCY.md) for complete idempotency design.

## Recovery

See [RECOVERY_SYSTEM.md](RECOVERY_SYSTEM.md) for complete recovery/rollback design.

## Audit Logging

See [AUDIT_LOGGING.md](AUDIT_LOGGING.md) for complete audit logging design.

## Monitoring

See [MONITORING.md](MONITORING.md) for health monitoring design.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/approve-application/index.ts` | Added Phase 2 fallback + Phase 3 state machine |
| `supabase/migrations/036_provisioning_engine.sql` | New: provisioning_jobs, audit_logs, dashboard view |
| `src/config/features.ts` | Added `transactionalProvisioning` flag |
| `src/services/applicationService.ts` | Added idempotencyKey when flag is enabled |
| `.env` | Added `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` |
| `.env.example` | Added `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` |

## Files Created

| File | Purpose |
|------|---------|
| `docs/PROVISIONING_AUDIT.md` | Complete audit of every operation, table, failure point |
| `docs/PROVISIONING_ENGINE.md` | This file — engine architecture |
| `docs/STATE_MACHINE.md` | State machine design |
| `docs/IDEMPOTENCY.md` | Idempotency design |
| `docs/RECOVERY_SYSTEM.md` | Recovery/rollback design |
| `docs/AUDIT_LOGGING.md` | Audit logging design |
| `docs/MONITORING.md` | Health monitoring design |
| `docs/PHASE3_IMPLEMENTATION.md` | Implementation report |
| `docs/PHASE3_TEST_PLAN.md` | Test plan and results |
| `docs/PHASE3_SUMMARY.md` | Executive summary |
