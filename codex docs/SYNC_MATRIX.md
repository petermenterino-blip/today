# Mentorino Synchronization Matrix

Legend: Pass = verified by completed test; Fail = implementation defect found; Blocked = requires controlled database writes or role credentials; Static = code path exists but runtime behavior is unverified.

| Source | Target | Status | Evidence / Gap |
|---|---|---|---|
| Visitor application | Mentor applications | Blocked | Submission would mutate configured DB |
| Mentor approval | Student account | Fail | Client-side provisioning; non-atomic |
| Approval | Mentor student list | Blocked | No mentor credential/fixture |
| Approval | Messaging contact | Fail | CRM initialization not awaited |
| Approval | Notifications | Blocked | No safe write environment |
| Approval | Dashboard metrics | Blocked | No safe write environment |
| Approval | Analytics | Blocked | No safe write environment |
| Student profile | Mentor view | Blocked | Two live roles required |
| Mentor task | Student task list | Static | Realtime invalidation code exists |
| Student task completion | Mentor dashboard | Blocked | Two live roles and writes required |
| Mentor session | Student sessions | Static | Table subscription/query paths exist |
| Student file | Mentor files | Blocked | Upload/write prohibited |
| Mentor resource | Student resources | Fail | RLS scope is overly broad |
| Mentor message | Student message thread | Blocked | Two live roles and writes required |
| Student reply | Mentor message thread | Blocked | Two live roles and writes required |
| Mentor form assignment | Student forms | Blocked | No mentor fixture |
| Student form submission | Mentor response | Blocked | Write prohibited |
| Gallery update | Public gallery | Static | Public read and gallery service exist |
| Settings update | Public website | Static | Public settings read policy exists |
| Events | Calendar | Static | Shared service/query paths exist |
| Bookings | Sessions | Blocked | Write prohibited |
| Credentials | Student dashboard | Blocked | No covered flow |
| Files | Resources | Blocked | No covered flow |
| Student goals | Student dashboard | Pass | Mocked Chromium E2E |
| Student tasks | Student dashboard | Pass | Mocked Chromium E2E |
| Student journal | Student dashboard | Pass | Mocked Chromium E2E |
| Student sessions | Student dashboard | Pass | Mocked Chromium E2E |

## Realtime Architecture Review

- Supabase `postgres_changes` subscriptions are present.
- Query invalidation is debounced by two seconds, so "instant" updates are not guaranteed.
- Channels use random names and are removed on effect cleanup.
- `getActiveChannelCount()` always returns zero, preventing duplicate-channel observability.
- No automated multi-context realtime latency or reconnect test exists.
