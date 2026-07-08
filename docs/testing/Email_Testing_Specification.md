# Email Testing Specification

| Document ID | QA-EML-010 |
|---|---|
| Document Title | Email Testing Specification |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Resend Edge Function architecture |

---

## 1. Introduction

Mentorino sends transactional emails via **Resend** through a **Supabase Edge Function** (`supabase.functions.invoke('resend')`). There is **no email queue**, **no delivery tracking DB**, and **no bounce handling webhook**.

### Email Service Architecture

```
Client Code
  └─→ edgeFunctionService.sendEmail({to, subject, templateKey, variables})
       └─→ emailTemplateService.render(templateKey, variables)
            └─→ supabase.from('email_templates').select('*').eq('key', templateKey)
       └─→ supabase.functions.invoke('resend', {body: {to, subject, html}})
            └─→ Resend API → Email delivered
```

### Email Types

| Email Type | Template Key | Trigger | Recipient |
|-----------|-------------|---------|-----------|
| Welcome Email | `welcome` | Application approved | New student |
| Session Reminder | `session-reminder` | 24h before session | Student + Mentor |
| Task Assignment | `task-assigned` | Mentor assigns task | Student |
| Task Submitted | `task-submitted` | Student submits task | Mentor |
| Inactivity Alert | `inactivity` | 7 days no activity | Mentor |
| Progress Summary | `progress-summary` | Weekly | Student |
| Password Reset | (Supabase built-in) | User requests reset | User |
| Custom Email | (dynamic) | Mentor sends via Emails tab | Selected recipients |

### Service Functions

| Function | Purpose | Supabase Pattern |
|----------|---------|-----------------|
| `emailTemplateService.fetchAll()` | Get all templates | `supabase.from('email_templates').select('*')` |
| `emailTemplateService.fetchByKey(key)` | Get single template | `supabase.from('email_templates').select('*').eq('key', key).single()` |
| `emailTemplateService.update(key, data)` | Update template | `supabase.from('email_templates').update(data).eq('key', key)` |
| `emailTemplateService.render(templateKey, variables)` | Render template with vars | Client-side string interpolation |
| `emailTemplateService.send(to, subject, templateKey, variables)` | Send templated email | Invokes Resend edge function |
| `emailTemplateService.sendBroadcast(recipients, templateKey, variables)` | Send to multiple | Loops through recipients |
| `edgeFunctionService.sendEmail({to, subject, html})` | Direct send | `supabase.functions.invoke('resend', ...)` |
| `edgeFunctionService.sendCustomEmail({to, subject, templateKey, variables})` | Custom template send | Combines render + invoke |

---

## 2. Test Cases

### Module 2.1: Email Template Service

#### EML-TC-001: Fetch All Templates

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-001 |
| **Module** | Email Templates |
| **Feature** | Fetch All |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional / Integration |
| **Test Data** | Existing email templates in DB |
| **Preconditions** | Mentor authenticated, templates exist |

**Objective**: Verify all email templates are fetched correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `emailTemplateService.fetchAll()` | Returns array of templates with key, subject, body, variables |
| 2 | Verify each template | Has required fields: key, subject, body, created_at, updated_at |

---

#### EML-TC-002: Fetch Template by Key

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-002 |
| **Module** | Email Templates |
| **Feature** | Fetch by Key |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Template key: "welcome" |
| **Preconditions** | Template exists |

**Objective**: Verify single template is fetched by key.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `emailTemplateService.fetchByKey('welcome')` | Returns template with key "welcome" |
| 2 | Verify template content | Subject: "Welcome to Mentorino", body contains expected HTML |

**Negative**: Fetch non-existent key → error or null.

---

#### EML-TC-003: Render Template with Variables

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-003 |
| **Module** | Email Templates |
| **Feature** | Template Rendering |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Template with {{studentName}}, {{mentorName}} variables |
| **Preconditions** | Template exists |

**Objective**: Verify variable interpolation in templates.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Render template with `{studentName: "John", mentorName: "Jane"}` | Variables replaced: "Hello John" / "Your mentor Jane" |
| 2 | Render with missing variable `{studentName: "John"}` | Variable left as `{{mentorName}}` or handled gracefully |
| 3 | Render with extra variable `{studentName: "John", mentorName: "Jane", extra: "value"}` | Extra variable ignored, template renders correctly |
| 4 | Render empty body template | Empty string returned |

---

### Module 2.2: Email Sending

#### EML-TC-004: Send Templated Email

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-004 |
| **Module** | Email Sending |
| **Feature** | Send Email |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / Integration |
| **Test Data** | To: test@example.com, Template: "welcome", Variables: {studentName: "Test"} |
| **Preconditions** | Authenticated user, template exists |

**Objective**: Verify templated email is sent via Resend edge function.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `emailTemplateService.send('test@example.com', 'Welcome', 'welcome', {studentName: 'Test'})` | Returns success |
| 2 | Verify email received | Email appears at test@example.com (if accessible) |
| 3 | Verify email content | Subject matches template, body has variables interpolated |

**Validation**:
- **Edge Function**: `supabase.functions.invoke('resend', {body: {to, subject, html}})` returns `{data: {success: true, id}}`

---

#### EML-TC-005: Send Email with Invalid Address

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-005 |
| **Module** | Email Sending |
| **Feature** | Error Handling |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional / Negative |
| **Test Data** | Invalid email: "not-an-email" |
| **Preconditions** | Authenticated |

**Objective**: Verify error handling for invalid email addresses.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call send function with invalid email | Error returned from Resend API |
| 2 | Verify error handling | Error toast displayed, no crash |

---

#### EML-TC-006: Send Broadcast Email

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-006 |
| **Module** | Email Sending |
| **Feature** | Broadcast |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Multiple recipients |
| **Preconditions** | Mentor authenticated |

**Objective**: Verify broadcast email is sent to multiple recipients.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `emailTemplateService.sendBroadcast(['a@test.com', 'b@test.com'], 'announcement', {})` | Both recipients receive email |
| 2 | Verify each recipient | Each email address receives the email |

---

### Module 2.3: Automated Email Triggers

#### EML-TC-007: Session Reminder Email (24h)

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-007 |
| **Module** | Email Triggers |
| **Feature** | Session Reminder |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional / Integration |
| **Test Data** | Session scheduled for 24 hours from now |
| **Preconditions** | Session exists, cron/scheduled function runs |

**Objective**: Verify session reminder email is sent 24 hours before session.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Schedule a session for 24h from now | Session created |
| 2 | Trigger the scheduled reminder function | Email sent to student and mentor |
| 3 | Verify email content | Contains session title, date, time, meeting link |

---

#### EML-TC-008: Welcome Email on Approval

| Field | Value |
|-------|-------|
| **Test ID** | EML-TC-008 |
| **Module** | Email Triggers |
| **Feature** | Welcome Email |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Application approval |
| **Preconditions** | Mentor about to approve application |

**Objective**: Verify welcome email is sent when application is approved.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Approve a pending application | Edge Function `approve-application` runs |
| 2 | Check applicant email | Welcome email received with login instructions |

---

## 3. Automation Mapping

| Test Cases | Tool | Status |
|-----------|------|--------|
| EML-TC-001, EML-TC-002 | Vitest (service functions) | ❌ Missing |
| EML-TC-003 | Vitest (template rendering) | ❌ Missing |
| EML-TC-004, EML-TC-005 | Playwright / Vitest | ❌ Missing |
| EML-TC-006 | Playwright (mentor email tab) | ❌ Missing |
| EML-TC-007, EML-TC-008 | Manual (cron-dependent) | ❌ Missing |
