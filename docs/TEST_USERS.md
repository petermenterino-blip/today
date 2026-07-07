# Test Users

Permanent QA accounts for the staging environment.

## Credentials

| Role     | Email                     | Password                           | Notes                            |
|----------|---------------------------|------------------------------------|----------------------------------|
| Mentor   | mentor.qa@mentorino.test  | `[see staging vault]`              | Administrator — manages 2 students, approves applications, creates tasks |
| Student1 | student1.qa@mentorino.test | `[see staging vault]`             | PM mentee, 3 goals, 3 tasks, 2 sessions |
| Student2 | student2.qa@mentorino.test | `[see staging vault]`             | Cybersecurity mentee, 3 goals, 2 tasks, 2 sessions |
| Visitor  | —                         | —                                  | Unauthenticated — uses application form only |

## Relationship

```
Mentor (Administrator) ─── manages 2 students
  ├── Student1 (product management, high engagement)
  └── Student2 (cybersecurity, medium engagement)
```

## Data

Each student has:
- **Goals** (3 each) with milestones (completed + pending)
- **Tasks** assigned by mentor (varying priorities and due dates)
- **Sessions** (scheduled, varying types)
- **Conversation** with the mentor (with messages)
- **Notifications** (session reminders, task due, system messages)
- **Timeline events** (application approval, goal, milestone, session completion)
- **Journal entries** (daily and weekly reflections)
- **Student progress** tracked (started_at, lessons)

Visitor has: one pending application, no other seeded data.

## Security

- These accounts are **staging-only**. They must NOT exist in production.
- No mentor account exists — the mentor role serves as the administrator.
- Passwords are NOT stored in this document — retrieve from the vault.
- The visitor account has no auth user — used only for application submission testing.
- For CI/CD pipelines, set credentials via environment variables (see `auth.setup.ts`).

## Role Permissions

| Capability                    | Mentor | Student1 | Student2 | Visitor |
|-------------------------------|--------|----------|----------|---------|
| Approve/Reject applications   | ✓      | ✗        | ✗        | ✗       |
| View all students             | ✓      | ✗        | ✗        | ✗       |
| View own data                 | ✓      | ✓        | ✓        | ✗       |
| View other student data       | ✗      | ✗        | ✗        | ✗       |
| Submit application            | ✗      | ✗        | ✗        | ✓       |
| Messaging                     | ✓      | ✓        | ✓        | ✗       |
| Submit journal                | ✗      | ✓        | ✓        | ✗       |
