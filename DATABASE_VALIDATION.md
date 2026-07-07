# Database Validation

Direct service-role `count=exact` results from staging:

| Table | Count | Status |
|---|---:|---|
| profiles | 3 | PASS |
| applications | 9 | PASS |
| goals | 2 | PASS |
| tasks | 2 | PASS |
| sessions | 2 | PASS |
| messages | 27 | PASS |
| notifications | 3 | PASS |
| journals | 1 | PASS |
| resources | 2 | PASS |
| events | 1 | PASS |
| audit_logs | unavailable | FAIL |

Presence/count is not proof of full CRUD, referential cleanup, rollback, or RLS correctness. Add transaction-correlated before/after assertions and orphan queries. Priority: Critical.
