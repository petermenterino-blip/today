# Public Website Testing Specification

| Document ID | QA-PUB-004 |
|---|---|
| Document Title | Public Website Testing Specification |
| Version | 2.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-06-15 | QA Team | Initial draft |
| 2.0 | 2026-07-08 | QA Team | Customized for Vite + React 19 + HashRouter + Supabase SDK |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope](#2-scope)
3. [Test Environment](#3-test-environment)
4. [Test Data](#4-test-data)
5. [Feature Modules](#5-feature-modules)
6. [Test Cases](#6-test-cases)
7. [Automation Mapping](#7-automation-mapping)

---

## 1. Introduction

This document specifies the testing requirements for the **Mentorino Public Website** — the publicly accessible portion of the application. The public website is a **single-page application** using **HashRouter** (all routes under `/#/` prefix). It is accessible to unauthenticated **visitor** role users and serves as the entry point for mentorship applications, consultation bookings, and platform information.

---

## 2. Scope

### In Scope

| Module | Routes | Description |
|--------|--------|-------------|
| Landing Page | `/#/` | Hero, features, testimonials, CTA, footer |
| About | `/#/about` | Mission, team, story |
| Programs | `/#/programs` | Public program listings |
| Consultation | `/#/consultation` | Consultation information |
| Consultation Overview | `/#/consultation-overview` | Consultation details |
| FAQ | `/#/faq` | Frequently asked questions |
| Contact | `/#/contact` | Contact form with validation |
| Gallery | `/#/gallery` | Public image gallery |
| Mentorship | `/#/mentorship` | Mentorship program information |
| Auth | `/#/auth` | Login form (redirects to dashboard if authenticated) |
| Apply | `/#/apply` | 4-step mentorship application form |
| Booking | `/#/booking` | Consultation booking |
| Book Call | `/#/book-call` | Booking alias |
| Privacy | `/#/privacy` | Privacy policy |
| Terms | `/#/terms` | Terms of service |
| Reset Password | `/#/reset-password` | Password reset form |
| Store | `/#/store` | Product store (student + mentor) |
| Survey | `/#/survey` | Survey participation (student + mentor) |
| 404 | `/*` | Not found page |

### Out of Scope

- Student portal features (`/#/student/*`)
- Mentor dashboard features (`/#/mentor/*`)
- Settings page (`/#/settings`)
- Authentication flows beyond login form UI
- Internal data synchronization

---

## 3. Test Environment

| Environment | URL | Notes |
|-------------|-----|-------|
| Production/Staging | `https://today-ten-zeta.vercel.app` | Single environment |
| Local | `http://localhost:5173` | Vite dev server |

### Browser Coverage

| Browser | Playwright Project |
|---------|-------------------|
| Chrome (Desktop) | chromium, chromium-visitor |
| Firefox (Desktop) | firefox |
| Safari (Desktop) | webkit |
| Chrome (Mobile) | mobile-chrome (Pixel 9) |
| Safari (Mobile) | mobile-safari (iPhone 16) |

---

## 4. Test Data

| Data Type | Details |
|-----------|---------|
| Visitor User | No authentication, no session |
| Test Application | Fresh application submission with valid data |
| Test Contact Form | Valid/Invalid email, message content |
| Test Booking | Valid date/time selection |

---

## 5. Feature Modules

### Module 5.1: Landing Page (`/#/`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F01 | Page Load & Rendering | Critical |
| PUB-F02 | Navigation Bar | Critical |
| PUB-F03 | Hero Section | High |
| PUB-F04 | Features Section | Medium |
| PUB-F05 | Testimonials | Medium |
| PUB-F06 | Call-to-Action Buttons | Critical |
| PUB-F07 | Footer | High |
| PUB-F08 | ScrollToTop Behavior | Medium |

### Module 5.2: Static Content Pages

| Feature ID | Feature | Routes | Priority |
|------------|---------|--------|----------|
| PUB-F09 | About Page | `/#/about` | Medium |
| PUB-F10 | Programs Page | `/#/programs` | High |
| PUB-F11 | Consultation Page | `/#/consultation` | Medium |
| PUB-F12 | Consultation Overview | `/#/consultation-overview` | Medium |
| PUB-F13 | FAQ Page | `/#/faq` | Medium |
| PUB-F14 | Gallery Page | `/#/gallery` | Medium |
| PUB-F15 | Mentorship Page | `/#/mentorship` | High |
| PUB-F16 | Privacy Policy | `/#/privacy` | Low |
| PUB-F17 | Terms of Service | `/#/terms` | Low |
| PUB-F18 | 404 Page | `/*` | Medium |

### Module 5.3: Authentication (`/#/auth`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F19 | Login Form UI | Critical |
| PUB-F20 | Client-side Validation | High |
| PUB-F21 | Supabase Auth Error Handling | Critical |
| PUB-F22 | Post-Auth Redirect | Critical |

### Module 5.4: Application Form (`/#/apply`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F23 | Multi-step Form Navigation | Critical |
| PUB-F24 | Step 1: Personal Information | High |
| PUB-F25 | Step 2: Program Selection | High |
| PUB-F26 | Step 3: Background & Experience | High |
| PUB-F27 | Step 4: Review & Submit | Critical |
| PUB-F28 | Form Validation | High |
| PUB-F29 | Submission Success | High |

### Module 5.5: Booking (`/#/booking`, `/#/book-call`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F30 | Booking Page UI | High |
| PUB-F31 | Date/Time Selection | High |
| PUB-F32 | Submission & Confirmation | High |

### Module 5.6: Contact Form (`/#/contact`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F33 | Contact Form Rendering | Medium |
| PUB-F34 | Form Validation | Medium |
| PUB-F35 | Form Submission | Medium |

### Module 5.7: Store (`/#/store`) [Student + Mentor]

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F36 | Product Listing | Medium |
| PUB-F37 | Product Categories | Medium |
| PUB-F38 | Product Details | Medium |

### Module 5.8: Survey (`/#/survey`) [Student + Mentor]

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F39 | Survey List | Low |
| PUB-F40 | Survey Participation | Low |

### Module 5.9: Reset Password (`/#/reset-password`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F41 | Reset Password Form | High |
| PUB-F42 | Email Submission | High |

### Module 5.10: Pending Approval (`/#/pending-approval`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| PUB-F43 | Pending Approval Page | Medium |

---

## 6. Test Cases

---

### Module 5.1: Landing Page

#### PUB-TC-001: Landing Page Load & Visual Structure

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-001 |
| **Module** | Landing Page |
| **Feature** | Page Load & Rendering |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / UI |
| **Test Data** | None — public page, no auth required |
| **Preconditions** | User is not authenticated; navigated to `/#/` |

**Objective**: Verify that the landing page loads correctly with all major sections visible.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/` | Page loads within 3 seconds, no console errors |
| 2 | Observe Hero section | Hero section visible with main headline and CTA button |
| 3 | Scroll to Features section | Features section rendered with icons and descriptions |
| 4 | Scroll to Testimonials | Testimonial cards visible |
| 5 | Scroll to final CTA | Bottom CTA section visible |
| 6 | Observe Footer | Footer renders with links, social icons, copyright |

**Validation**:
- **UI**: All sections render with proper spacing, no layout shifts
- **Navigation**: URL shows `/#/`
- **Console**: No errors or warnings
- **TanStack Query**: No queries triggered (static page)

**Automation**: `e2e/landing.spec.ts` — chromium, firefox, webkit, mobile-chrome, mobile-safari

---

#### PUB-TC-002: Navigation Bar Links

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-002 |
| **Module** | Landing Page |
| **Feature** | Navigation Bar |
| **Priority** | Critical |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | None |
| **Preconditions** | User on `/#/` |

**Objective**: Verify all navigation links navigate to correct routes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "About" link | Navigates to `/#/about` |
| 2 | Click "Programs" link | Navigates to `/#/programs` |
| 3 | Click "Mentorship" link | Navigates to `/#/mentorship` |
| 4 | Click "FAQ" link | Navigates to `/#/faq` |
| 5 | Click "Contact" link | Navigates to `/#/contact` |
| 6 | Click "Apply" / "Get Started" CTA | Navigates to `/#/apply` |
| 7 | Click brand/logo | Navigates to `/#/` |

**Validation**:
- **Navigation**: Each link updates HashRouter URL correctly
- **UI**: Active link styling updates (if implemented)

**Automation**: `e2e/landing.spec.ts` — test: "navigation links work"

---

#### PUB-TC-003: Landing Page Role-Aware Content

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-003 |
| **Module** | Landing Page |
| **Feature** | Role-Aware Landing |
| **Priority** | Medium |
| **Severity** | Minor |
| **Test Type** | Functional |
| **Test Data** | Authenticated as student1.qa@mentorino.test |
| **Preconditions** | User logged in as student |

**Objective**: Verify landing page shows role-aware content when user is authenticated.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Auth successful |
| 2 | Navigate to `/#/` | Landing page loads but CTA may differ for authenticated users |
| 3 | Verify navigation | Student nav may not show visitor-specific links |

**Note**: Role-aware behavior depends on `Landing.tsx` implementation of `currentRole` prop.

---

### Module 5.2: Static Content Pages

#### PUB-TC-004: About Page

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-004 |
| **Module** | Static Pages |
| **Feature** | About Page |
| **Priority** | Medium |
| **Severity** | Minor |
| **Test Type** | UI |
| **Test Data** | None |
| **Preconditions** | Navigate to `/#/about` |

**Objective**: Verify About page renders with correct content.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/about` | Page loads, content visible |
| 2 | Scroll through content | Mission, story, team sections visible |
| 3 | Check layout | Responsive layout, no overflow |

**Validation**:
- **Navigation**: URL is `/#/about`
- **UI**: Content renders without layout issues
- **Console**: No errors

**Automation**: `e2e/smoke/discovery.spec.ts` (route discovery)

---

#### PUB-TC-005: Programs Page

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-005 |
| **Module** | Static Pages |
| **Feature** | Programs Page |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Public programs exist in `programs` table |
| **Preconditions** | Navigate to `/#/programs` |

**Objective**: Verify public programs display correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/programs` | Page loads, program cards/sections visible |
| 2 | Observe program listings | Programs fetched via `supabase.from('programs').select('*').eq('visibility', 'public')` |
| 3 | Click on a program | (If interactive) Program detail expands or navigates |

**Validation**:
- **DB**: Programs fetched from `programs` table where `visibility = 'public'`
- **TanStack Query**: Query key `['programs']` cached
- **UI**: Program cards show title, description, difficulty

---

#### PUB-TC-006: 404 Not Found Page

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-006 |
| **Module** | Static Pages |
| **Feature** | 404 Page |
| **Priority** | Medium |
| **Severity** | Minor |
| **Test Type** | Functional |
| **Test Data** | None |
| **Preconditions** | Navigate to non-existent route |

**Objective**: Verify 404 page renders for unknown routes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/nonexistent-route-xyz` | 404 / Not Found page renders |
| 2 | Verify content | "Page not found" message visible |
| 3 | Verify navigation options | Link back to home or navigation available |

**Automation**: `e2e/smoke/discovery.spec.ts`

---

### Module 5.3: Authentication

#### PUB-TC-007: Login Form UI & Validation

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-007 |
| **Module** | Authentication |
| **Feature** | Login Form |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / UI |
| **Test Data** | Valid email, invalid email, empty fields |
| **Preconditions** | Navigate to `/#/auth`, not authenticated |

**Objective**: Verify login form validates input and shows errors.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/auth` | Auth page renders with email + password inputs and Sign In button |
| 2 | Click Sign In with empty fields | Client-side validation: "Email is required", "Password is required" |
| 3 | Enter `notanemail` in email field | Validation: "Please enter a valid email address" |
| 4 | Enter valid email + `short` as password | No client-side validation on password length (Supabase handles) |
| 5 | Enter valid credentials | Submit button shows loading state, auth call initiated |

**Validation**:
- **UI**: Validation messages visible, form fields highlight
- **Navigation**: `/#/auth` remains on validation errors
- **Console**: No errors on validation-only actions

**Automation**: `e2e/authentication/auth.spec.ts` — test: "should show validation errors"

---

#### PUB-TC-008: Login with Invalid Credentials

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-008 |
| **Module** | Authentication |
| **Feature** | Login |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security / Functional |
| **Test Data** | Email: `student1.qa@mentorino.test`, Password: `wrongpassword` |
| **Preconditions** | On `/#/auth`, not authenticated |

**Objective**: Verify Supabase auth error is handled gracefully.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter valid email | Email accepted |
| 2 | Enter incorrect password | Password accepted |
| 3 | Click Sign In | Loading state, `supabase.auth.signInWithPassword()` called |
| 4 | Wait for response | Supabase returns `{error: AuthApiError}` |
| 5 | Observe UI | Toast/notification: "Invalid login credentials", form re-enabled |

**Validation**:
- **Supabase**: `signInWithPassword({email, password})` returns `{data: {user: null, session: null}, error: AuthApiError}`
- **UI**: Error toast via Sonner, no page navigation
- **Console**: No unhandled rejections
- **Sentry**: Auth errors should not be sent to Sentry (expected errors)

---

#### PUB-TC-009: Authenticated User Redirect from Auth Page

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-009 |
| **Module** | Authentication |
| **Feature** | Post-Auth Redirect |
| **Priority** | Critical |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Authenticated as student1.qa@mentorino.test |
| **Preconditions** | User is logged in as student |

**Objective**: Verify authenticated users are redirected to dashboard.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Redirected to `/#/student/dashboard` |
| 2 | Navigate to `/#/auth` | Immediately redirected to `/#/student/dashboard` |
| 3 | Verify dashboard | Dashboard content renders, no auth page flash |

---

### Module 5.4: Application Form

#### PUB-TC-010: Application Form Multi-Step Navigation

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-010 |
| **Module** | Application |
| **Feature** | Multi-step Form |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional |
| **Test Data** | None |
| **Preconditions** | Navigate to `/#/apply`, not authenticated |

**Objective**: Verify 4-step application form navigation works.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/apply` | Step 1 of 4 displayed: Personal Information |
| 2 | Observe step indicator | Visual step indicator showing current step (1/4) |
| 3 | Click "Next" without filling fields | Validation errors on required fields |
| 4 | Fill required fields for Step 1 | Fields accepted, errors cleared |
| 5 | Click "Next" | Moves to Step 2 |
| 6 | Complete all 4 steps | Step indicators update correctly |

**Validation**:
- **UI**: Step indicator updates, only current step visible
- **Navigation**: `/#/apply` remains (no route change between steps)

**Automation**: `e2e/application.spec.ts`

---

#### PUB-TC-011: Complete Application Submission

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-011 |
| **Module** | Application |
| **Feature** | Form Submission |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / Integration |
| **Test Data** | Valid visitor data (name, email, program, background) |
| **Preconditions** | On Step 1 of application form |

**Objective**: Verify successful application submission creates record in `applications` table.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Complete Step 1 (Personal Info) | All fields filled, no errors |
| 2 | Click Next → Step 2 (Program Selection) | Program options loaded from `programs` table |
| 3 | Select program, click Next → Step 3 | Background/experience fields shown |
| 4 | Fill background, click Next → Step 4 (Review) | Summary of all answers displayed |
| 5 | Click Submit | Loading state, `applicationService.submit(applicationData)` called |
| 6 | Wait for confirmation | Redirect to `/#/pending-approval` or success message |

**Validation**:
- **Supabase**: `applications` table has new row with `status: 'pending'`
- **Navigation**: URL updates to `/#/pending-approval`
- **UI**: Success message, no errors
- **TanStack Query**: `['applications']` cache may be invalidated

**Automation**: `e2e/application.spec.ts` — full flow test

---

### Module 5.5: Booking

#### PUB-TC-012: Booking Page Load & Submission

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-012 |
| **Module** | Booking |
| **Feature** | Consultation Booking |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Valid date/time, user contact info |
| **Preconditions** | Navigate to `/#/booking` |

**Objective**: Verify booking page loads and submission creates record.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/booking` | Booking page renders with form fields |
| 2 | Select date | Date picker works, valid dates selectable |
| 3 | Select time | Time slots displayed |
| 4 | Enter contact information | Name, email, phone fields accept input |
| 5 | Click Submit | Loading state, `bookingService.create()` called |
| 6 | Wait for confirmation | Success message or redirect to confirmation |

**Validation**:
- **Supabase**: `bookings` table has new row with `status: 'pending'`
- **UI**: Confirmation message visible

---

### Module 5.7: Store

#### PUB-TC-013: Store Page for Student

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-013 |
| **Module** | Store |
| **Feature** | Product Listing |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Authenticated as student1 |
| **Preconditions** | Logged in as student, navigate to `/#/store` |

**Objective**: Verify store page displays products from `products` table.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Authenticated |
| 2 | Navigate to `/#/store` | Store page renders |
| 3 | Observe product listings | Products fetched from `products` table via `productService` |
| 4 | Verify categories | Product categories visible |
| 5 | Click a product | Product detail expands or modal opens |

---

### Module 5.8: Survey

#### PUB-TC-014: Survey Participation

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-014 |
| **Module** | Survey |
| **Feature** | Survey Participation |
| **Priority** | Low |
| **Severity** | Minor |
| **Test Type** | Functional |
| **Test Data** | Authenticated as student1 |
| **Preconditions** | Logged in, navigate to `/#/survey` |

**Objective**: Verify survey page displays and accepts submissions.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/survey` | Survey list/current survey renders |
| 2 | Select/start survey | Survey questions displayed |
| 3 | Complete survey | Responses recorded via `surveyService` |
| 4 | Submit | Success confirmation |

---

### Module 5.9: Reset Password

#### PUB-TC-015: Reset Password Form

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-015 |
| **Module** | Reset Password |
| **Feature** | Password Reset Request |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Registered user email |
| **Preconditions** | Navigate to `/#/reset-password` |

**Objective**: Verify password reset form submits email to Supabase Auth.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/reset-password` | Reset form renders |
| 2 | Enter registered email | Email accepted |
| 3 | Click "Send Reset Link" | `supabase.auth.resetPasswordForEmail()` called |
| 4 | Observe confirmation | Success message: "Check your email for reset link" |

---

### Module 5.10: Pending Approval

#### PUB-TC-016: Pending Approval Page

| Field | Value |
|-------|-------|
| **Test ID** | PUB-TC-016 |
| **Module** | Pending Approval |
| **Feature** | Application Status |
| **Priority** | Medium |
| **Severity** | Minor |
| **Test Type** | UI |
| **Test Data** | Visitor with pending application |
| **Preconditions** | Application submitted, user on `/#/pending-approval` |

**Objective**: Verify pending approval page displays application status.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/pending-approval` | Page renders with "Application pending" message |
| 2 | Verify content | Information about next steps, estimated review time |

---

## 7. Automation Mapping

### Existing Playwright Coverage

| Test Cases | Playwright Spec File | Test Name / Describe Block |
|-----------|---------------------|---------------------------|
| PUB-TC-001, PUB-TC-002 | `e2e/landing.spec.ts` | Landing page tests |
| PUB-TC-003 | `e2e/visitor-flow.spec.ts` | Visitor role redirects |
| PUB-TC-004, PUB-TC-005, PUB-TC-006 | `e2e/smoke/discovery.spec.ts` | Route discovery and status |
| PUB-TC-007, PUB-TC-008, PUB-TC-009 | `e2e/authentication/auth.spec.ts` | Authentication flow |
| PUB-TC-010, PUB-TC-011 | `e2e/application.spec.ts` | Application form |
| PUB-TC-012 | `e2e/visitor-flow.spec.ts` | Booking interaction (new) |
| PUB-TC-013 | Not yet automated | Store page (new spec needed) |
| PUB-TC-014 | Not yet automated | Survey page (new spec needed) |
| PUB-TC-015 | `e2e/authentication/auth.spec.ts` | Password reset |
| PUB-TC-016 | Not yet automated | Pending approval page |

### Playwright Project Assignment

| Test Cases | Project | Reason |
|-----------|---------|--------|
| PUB-TC-001 to PUB-TC-008 | chromium-visitor | Visitor-only pages |
| PUB-TC-001 to PUB-TC-006 | chromium, firefox, webkit | Cross-browser verification |
| PUB-TC-001 to PUB-TC-006 | mobile-chrome, mobile-safari | Mobile responsiveness |
| PUB-TC-009 | chromium-student1 | Requires auth |
| PUB-TC-013, PUB-TC-014 | chromium-student1, chromium-mentor | Requires auth |
