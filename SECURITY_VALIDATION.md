# Security Validation

| Boundary | Status | Evidence | Remaining risk | Priority |
|---|---|---|---|---|
| Visitor → protected UI | PASS | Both protected-route tests redirected/denied | Deep-link/API matrix incomplete | Critical |
| Student B → Student A goals | PASS | Browser isolation assertion | Other entities and direct REST/storage access incomplete | Critical |
| Real auth required | PASS | Three seeded accounts used | JWT expiry/revocation incomplete | Critical |
| Scheduled function guard | PASS | Unauthenticated request returned 401 | Other functions returned 503 rather than 401/403 | Critical |
| Private storage isolation | PARTIAL | Private bucket flags confirmed | Cross-user object access not tested | Critical |
| RLS policy matrix | PARTIAL | UI observations only | Run CRUD matrix as anon, each student, mentor | Critical |
