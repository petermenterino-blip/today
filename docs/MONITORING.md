# Monitoring Configuration

Health check endpoints and alert thresholds for the staging environment.

## Edge Function Health

| Function                  | Endpoint                     | Expected Status | Interval |
|---------------------------|------------------------------|-----------------|----------|
| approve-application       | `/functions/v1/approve-application` | 200 (with valid body) | 5 min |

Alert when:
- Response time > 10s (Supabase Edge Function timeout)
- Non-2xx status for 3 consecutive checks
- Deployment hash does not match expected

## Provisioning Engine Monitoring

Track via `provisioning_dashboard` view:

```sql
-- Health check query (run every 5 minutes)
SELECT * FROM provisioning_dashboard;
```

| Metric                    | Warning Threshold            | Critical Threshold      |
|---------------------------|------------------------------|------------------------|
| Success rate (24h)        | < 95%                        | < 85%                  |
| Avg duration (24h)        | > 3s                         | > 8s                   |
| Retry rate (24h)          | > 10%                        | > 25%                  |
| Active failure count      | > 0 for 5 minutes            | > 0 for 15 minutes     |
| Rollback count (24h)      | > 0                          | > 2                    |

## Audit Log Integrity

```sql
-- Check for orphan audit entries (every hour)
SELECT COUNT(*) FROM provisioning_audit_logs al
WHERE NOT EXISTS (
  SELECT 1 FROM provisioning_jobs pj
  WHERE pj.id = al.request_id
);
```

Expected: 0 orphan entries.

## Failure Recovery Playbooks

### Failed Provisioning (MAX_RETRIES_EXCEEDED)
1. Check `provisioning_jobs` for error_detail
2. Determine if the failure is retryable (network/timeout) or non-retryable (validation)
3. For retryable: clear `status` to `pending` and `retry_count` to 0
4. For non-retryable: fix underlying issue, then run compensating actions manually

### Stuck Job (IN_PROGRESS > 15 min)
1. Query: `SELECT * FROM provisioning_jobs WHERE status = 'in_progress' AND created_at < NOW() - INTERVAL '15 minutes'`
2. Investigate which step is stuck via audit logs
3. Manually set status to `failed` or re-trigger

### Rollback Automation
Rollback script template:

```sql
-- Rollback provisioning for a specific application
-- Mirrors the compensating actions in the edge function's executeRollback()
BEGIN;
  -- 1. Find the user_id for this application
  WITH app AS (
    SELECT id, user_id FROM applications WHERE id = '<app-uuid>'
  )
  -- 2. Delete auth user (requires service_role or admin API call — separate step)
  --    Execute via: supabase auth admin delete-user <user-uuid>
  -- 3. Delete conversations and participants
  DELETE FROM conversation_participants
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE student_id IN (SELECT user_id FROM app)
  );
  DELETE FROM conversations WHERE student_id IN (SELECT user_id FROM app);
  -- 4. Delete goals
  DELETE FROM goals WHERE student_id IN (SELECT user_id FROM app);
  -- 5. Delete CRM data
  DELETE FROM analytics_events WHERE user_id IN (SELECT user_id FROM app);
  DELETE FROM student_timeline_events WHERE student_id IN (SELECT user_id FROM app);
  DELETE FROM dashboard_layouts WHERE user_id IN (SELECT user_id FROM app);
  DELETE FROM student_progress WHERE user_id IN (SELECT user_id FROM app);
  -- 6. Delete profile
  DELETE FROM profiles WHERE id IN (SELECT user_id FROM app);
  -- 7. Restore application status
  UPDATE applications SET status = 'pending_review', user_id = NULL, updated_at = NOW()
  WHERE id = '<app-uuid>';
COMMIT;
```

## Dashboard View

The `provisioning_dashboard` view exposes:
- `total_attempts`, `success_count`, `failure_count`
- `success_rate`, `failure_rate`
- `avg_duration_ms`, `total_retries`
- `last_failure_at`, `last_failure_error`
- `rollback_count`
- `jobs_by_status` (JSON breakdown)

Query this via the Supabase dashboard SQL editor or set up a scheduled check.

## Exported Metrics for External Monitoring

For integration with external monitoring (e.g., Better Stack):

```
# Prometheus-style text format (export via scheduled query)
provisioning_success_rate 0.95
provisioning_avg_duration_ms 2500
provisioning_retry_rate 0.05
provisioning_rollback_count 0
```
