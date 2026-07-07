# Failed and Incompletely Validated Features

| Feature | Status | Evidence | Root cause | Recommended fix | Priority |
|---|---|---|---|---|---|
| approve-application function | FAIL | HTTP 503 | Deployment/runtime/secrets unknown | Inspect staging function logs/secrets, redeploy, retest authorized flow | Critical |
| resend function | FAIL | HTTP 503 | Deployment/runtime/secrets unknown | Configure secret and test controlled auth + delivery | Critical |
| gemini function | FAIL | HTTP 503 | Deployment/provider configuration unknown | Repair deployment and verify graceful provider errors | High |
| middleware function route | FAIL | HTTP 404 | Missing deployment or stale contract | Deploy or remove/update route contract | Critical |
| audit logging | FAIL | Table unavailable to direct verification | Migration/exposure/runtime unknown | Deploy/verify audit table and assert mutation events | Critical |
| Exhaustive CRUD/sync/security/failure/performance | PARTIAL | Not present in 43-test evidence | Coverage gap | Implement and execute the matrices described in reports | Critical |
