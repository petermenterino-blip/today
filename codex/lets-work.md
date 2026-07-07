# Mentorino Production Recovery & Implementation Plan

### Version: v1.0

### Objective: Safely move from **28% Production Ready → 100% Production Ready**

### Strategy: **Zero-risk implementation with rollback at every phase**

---

# Guiding Principles

This implementation is **NOT** about adding new features.

The goal is to make the current application:

* Production Ready
* Secure
* Easily Testable
* Easily Rollbackable
* Stable
* Zero Downtime

Every phase must satisfy the following rules before moving to the next phase.

---

# Golden Rules

## Rule 1

Never modify Production Database directly.

Everything must be tested in a Staging Supabase project first.

---

## Rule 2

Never change more than one core system in a single phase.

Example:

❌ RLS + Authentication + Messaging

Good:

✅ Only RLS

---

## Rule 3

Every phase must end with

```
Git Commit

Git Tag

Supabase Migration

Documentation

Testing

Rollback Point
```

---

## Rule 4

Never delete existing working code.

Instead

```
Create new version

Test

Switch

Remove old code only after release
```

---

## Rule 5

Every migration must be reversible.

Every migration needs

```
up.sql

down.sql
```

---

# Repository Strategy

```
main
│
├── production
│
├── staging
│
└── feature/*
```

Never work directly on main.

---

# Git Strategy

Every phase

```
Feature Branch

↓

Implementation

↓

Testing

↓

Pull Request

↓

Merge

↓

Tag

↓

Release
```

Example

```
feature/phase-1-rls

feature/phase-2-edge-functions

feature/phase-3-provisioning
```

---

# Git Tags

Every completed phase

```
v1.0-base-stable

v1.1-rls

v1.2-edge-functions

v1.3-approval

v1.4-testing

v1.5-production-ready
```

Rollback becomes

```
git checkout v1.2-edge-functions
```

---

# Supabase Strategy

Never modify schema manually.

Everything through

```
supabase migration new
```

Every migration

```
Migration Up

Migration Down
```

Never

```
Open SQL Editor

Paste SQL

Run
```

---

# Database Backup Strategy

Before every phase

Take

```
Database Schema

Policies

Functions

Triggers

Storage

Auth Config
```

Store

```
backup/

phase-01/

phase-02/

phase-03/
```

---

# Environment Strategy

Create three environments

```
Development

↓

Staging

↓

Production
```

Never test production.

---

# Implementation Roadmap

---

# Phase 0

## Freeze Stable Version

Goal

Create a permanent rollback point.

Tasks

* Verify Build
* Verify TypeScript
* Verify Tests
* Verify Current Features
* Verify Database
* Verify Storage
* Verify Auth
* Export Schema
* Export Policies
* Tag Git

Deliverable

```
v1.0-base-stable
```

Rollback

```
git checkout v1.0-base-stable
```

Supabase

Restore

```
schema.sql

policies.sql

storage.sql
```

---

### Copilot Prompt – Phase 0

```
Audit the entire project and create a production baseline.

Do NOT change any code.

Generate:

• Complete feature inventory
• Route inventory
• Database schema inventory
• Storage inventory
• Auth inventory
• RLS inventory
• Edge Functions inventory
• Environment variables inventory

Verify

✓ npm build
✓ npm lint
✓ npm test

Generate BASELINE_REPORT.md

This becomes the rollback reference.

Do not modify anything.
```

---

# Phase 1

## Secure Database

Goal

Fix every RLS issue.

Nothing else.

Tasks

* Review every policy
* Remove Full Access
* Create owner policies
* Mentor policies
* Admin policies
* Student isolation
* Storage policies

Deliverables

```
RLS_MATRIX.md

Migration

Tests
```

Rollback

```
Rollback migration

Restore previous policies
```

---

### Copilot Prompt – Phase 1

```
Audit every Supabase RLS policy.

Replace blanket authenticated policies with least-privilege policies.

Requirements

• No cross-user access
• Mentor only sees assigned students
• Student sees only own data
• Visitor sees only public data
• Admin retains admin permissions

Generate:

RLS_TEST_PLAN.md

Do not modify unrelated code.

All changes must be contained in one migration.

Migration must be reversible.
```

---

# Phase 2

## Move Account Provisioning

Goal

Remove browser-side account creation.

Tasks

Create

```
Edge Function

↓

Create Auth User

↓

Create Profile

↓

Create CRM

↓

Create Goals

↓

Create Notifications

↓

Email

↓

Return Success
```

Rollback

Disable Edge Function

Restore old implementation temporarily if required.

---

### Copilot Prompt – Phase 2

```
Move all application approval logic from the browser into a Supabase Edge Function.

Requirements

• Mentor authorization validation
• Service role only
• Idempotent
• Transaction-safe
• Secure logging
• Error handling
• Audit trail

Do not change UI.

UI should call the new endpoint only.

Keep previous implementation behind a feature flag until validated.
```

---

# Phase 3

## Transactional Provisioning

Tasks

Make

```
Create User

↓

Create Profile

↓

CRM

↓

Notifications

↓

Goals

↓

Analytics

↓

Email
```

Atomic.

Either

Everything succeeds

or

Everything rolls back.

---

### Copilot Prompt – Phase 3

```
Convert the provisioning workflow into an atomic transaction.

Requirements

• No partial account creation
• Retry support
• Idempotency key
• Recovery log
• Rollback on failure

Generate provisioning documentation.

Do not modify unrelated systems.
```

---

# Phase 4

## Invitation System

Tasks

Replace

```
Email Lookup
```

with

```
Signed Token

↓

Edge Function

↓

Validate

↓

Create Password

↓

Login
```

---

### Copilot Prompt – Phase 4

```
Replace the invitation flow with a secure signed-token invitation system.

Requirements

• Expiring tokens
• Single use
• Server-side validation
• Audit logging
• Graceful expiry handling

Maintain backward compatibility during rollout.

Provide rollback instructions.
```

---

# Phase 5

## QA Environment

Tasks

Create

```
New Supabase

Seed Data

Mentor

Students

Visitor

Admin
```

---

### Copilot Prompt – Phase 5

```
Create a fully isolated staging environment.

Requirements

• Separate Supabase project
• Seed scripts
• Test users
• Test storage
• Test email provider
• Environment switching

No production data may be used.
```

---

# Phase 6

## End-to-End Testing

Add

```
Visitor

Student

Mentor

Admin

Messaging

Resources

Bookings

AI

Notifications
```

Tests.

---

### Copilot Prompt – Phase 6

```
Create a comprehensive Playwright test suite covering all roles and critical workflows.

Include:
• Authentication
• Application submission
• Approval
• Messaging
• Resources
• Sessions
• Notifications
• File uploads
• Role isolation

Generate reports and fail the pipeline on critical regressions.
```

---

# Phase 7

## Realtime

Test

```
Messages

Tasks

Notifications

Resources

Sessions
```

---

### Copilot Prompt – Phase 7

```
Implement automated realtime synchronization tests using two browser contexts.

Verify:
• Instant updates
• Reconnect handling
• Duplicate subscription prevention
• Channel cleanup
• Latency measurements
```

---

# Phase 8

## Performance

Add

```
Lighthouse

Accessibility

Memory

Network

CPU
```

budgets.

---

### Copilot Prompt – Phase 8

```
Introduce performance and accessibility gates into CI.

Requirements:
• Lighthouse
• Accessibility scans
• Performance budgets
• Bundle size tracking
• Long-session stability tests
```

---

# Phase 9

## Production Release

Checklist

✓ Security

✓ Tests

✓ Build

✓ Performance

✓ Accessibility

✓ Documentation

✓ Monitoring

✓ Backups

✓ Rollback verified

---

# Production Rollback Plan

## Git Rollback

```
Identify the last stable Git tag.
Create a hotfix branch from that tag if investigation is needed.
Deploy the tagged version after confirming rollback tests pass.
Do not force-push or rewrite history on the main branch.
```

---

## Supabase Rollback

```
Apply the matching down migration for the affected phase.
Restore the database backup taken before the phase if needed.
Verify:
• Schema
• RLS policies
• Edge Functions
• Storage policies
• Auth configuration
Run smoke tests before reopening production traffic.
```

---

## Feature Flag Rollback

Every major backend change should be behind a feature flag where practical.

Example:

```
ENABLE_EDGE_APPROVAL

ENABLE_NEW_INVITATION_FLOW

ENABLE_NEW_RLS_ENGINE
```

If an issue occurs:

```
Disable feature flag

↓

Restart deployment

↓

Application returns to previous stable path
```

---

# Exit Criteria for Each Phase

A phase is complete only if all of the following are true:

* ✅ Build passes (`npm run build`)
* ✅ Lint passes
* ✅ Unit tests pass
* ✅ Integration/E2E tests for the changed area pass
* ✅ No regression in existing functionality
* ✅ Git tag created
* ✅ Supabase migration (up and down) verified
* ✅ Rollback procedure tested successfully
* ✅ Documentation updated
* ✅ Team review completed

---

## Final Goal

At the end of this roadmap, Mentorino should have:

* Secure row-level security with verified tenant isolation.
* Server-side account provisioning through Edge Functions.
* Transactional and recoverable approval workflows.
* Isolated development, staging, and production environments.
* Comprehensive automated testing across all roles.
* Verified rollback capability for both Git and Supabase.
* A controlled, low-risk deployment process suitable for production use.

This approach minimizes the chance of breaking the existing codebase while ensuring every phase can be safely reversed if a problem is discovered.
