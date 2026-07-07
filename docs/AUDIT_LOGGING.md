# Audit Logging

**Date:** 2026-07-06
**Phase:** 3

---

## Purpose

Every provisioning attempt produces an immutable audit trail for debugging, compliance, and monitoring.

## Log Table

```sql
provisioning_audit_logs (
  id                  uuid PRIMARY KEY,
  provisioning_job_id uuid REFERENCES provisioning_jobs(id),
  application_id      uuid REFERENCES applications(id),
  request_id          text,       -- Trace identifier
  mentor_id           uuid,       -- Who triggered the provisioning
  action              text,       -- What happened
  step                text,       -- Which state machine step
  status              text,       -- started | completed | failed | rolled_back | retrying | skipped
  message             text,       -- Human-readable description
  metadata            jsonb,      -- Arbitrary structured data
  duration_ms         integer,    -- Time since request start
  created_at          timestamptz -- Immutable timestamp
)
```

## Audit Event Types

| Action | When | Metadata |
|--------|------|----------|
| `authorization_checked` | Mentor auth check passed | - |
| `step_started` | Step execution begins | - |
| `step_completed` | Step execution succeeds | `duration_ms` |
| `step_failed` | Step execution fails | `code`, `duration_ms` |
| `retry_scheduled` | Retryable error, retries left | `retry_count` |
| `email_skipped` | Resend key not configured | - |
| `rollback_started` | Rollback begins | - |
| `compensating` | Individual compensation action | - |
| `compensated` | Compensation action complete | - |
| `rollback_completed` | Rollback complete | `duration_ms` |
| `provisioning_completed` | Full success | `total_duration_ms`, `steps_completed` |
| `job_failed` | Non-retryable failure | Error details |

## Logging Rules

1. **Never block provisioning** — audit log failures are caught silently
2. **No sensitive information** — passwords, tokens, secrets are never logged
3. **Immutable** — logs are INSERT-only, never updated or deleted
4. **Traceable** — each log has a `request_id` for correlation
5. **Timing** — every log includes `duration_ms` from request start

## Query Examples

### Recent failures
```sql
SELECT * FROM provisioning_audit_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

### Provisioning timeline for an application
```sql
SELECT * FROM provisioning_audit_logs
WHERE application_id = 'abc-123'
ORDER BY created_at;
```

### Average step duration
```sql
SELECT step, AVG(duration_ms) as avg_ms, COUNT(*) as count
FROM provisioning_audit_logs
WHERE status = 'completed' AND duration_ms IS NOT NULL
GROUP BY step
ORDER BY avg_ms DESC;
```
