# Student Feature Matrix

| Feature | Status | Evidence | Gap / recommended action | Priority |
|---|---|---|---|---|
| Real login/dashboard/logout | PASS | Student A browser flow | — | Critical |
| Goals and milestones | PASS | List/detail rendered from staging data | Create/update/delete/progress sync missing | Critical |
| Tasks | PASS | Assigned task list rendered | Completion and mentor sync missing | Critical |
| Journal, sessions, messaging, resources, events/calendar, profile | PASS | Page-level browser checks passed | Exhaustive CRUD/upload/download missing | High |
| Realtime messaging | PASS | Student reply reached mentor; mentor message reached student | Offline/duplicates/attachments missing | Critical |
| Student B isolation | PASS | Own goals/tasks shown; Student A goals not visible | Direct API cross-user matrix incomplete | Critical |
| Notifications, assignments, settings, password change | PARTIAL | Not exercised end-to-end | Add success/error/session invalidation tests | High |

Evidence: `playwright-report/index.html`; no retry trace/video was generated.
