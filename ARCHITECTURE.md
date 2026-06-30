# Mentorino - Official Architecture Specification

Version: 1.0

---

# Purpose

This document defines the official architecture for Mentorino.

All future development MUST follow this architecture.

Do not change the architecture unless explicitly instructed.

This document is the source of truth.

---

# Product Overview

Mentorino is a premium mentorship platform connecting mentors and students through structured programs, sessions, goals, journals, messaging, AI assistance, events, analytics, and progress tracking.

The application is intended to become a production SaaS while remaining lightweight, serverless, and easy to maintain.

---

# Primary Goals

The platform must be:

* Fully Serverless
* Low Cost
* Easy to Maintain
* Highly Secure
* Scalable
* Production Ready
* Easy to Deploy
* Easy to Migrate
* Optimized for Free Tiers

Target Capacity

* 1,000 Students
* 30–50 Mentors
* 200–300 Daily Active Users

---

# Core Engineering Rules

## Rule 1

Mentorino is a **100% Serverless Application**.

Never introduce:

* Express
* Node.js backend server
* NestJS
* Fastify
* Hono
* Koa
* Django
* Laravel
* Spring Boot
* ASP.NET
* Docker
* Kubernetes
* EC2
* VPS

No dedicated backend servers.

---

## Rule 2

Prefer managed services over custom infrastructure.

Example

Preferred

React

↓

Supabase

Avoid

React

↓

Express

↓

PostgreSQL

---

## Rule 3

Keep infrastructure simple.

Do not over-engineer.

Choose the simplest reliable solution.

---

## Rule 4

Always optimize for Free Tier usage.

All implementation decisions must consider

* Storage limits
* API limits
* Function limits
* Database usage
* Build limits
* Monthly quotas

---

# Official Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Motion
* Lucide React
* React Router
* TanStack Query

---

## Hosting

Vercel

Vercel is used ONLY for

* Static Frontend Hosting
* Preview Deployments
* CI/CD

Avoid using Vercel Functions whenever possible.

The frontend should remain a Static SPA.

---

## Backend Platform

Supabase

Use for

* PostgreSQL Database
* Authentication
* Storage
* Realtime
* Row Level Security
* Edge Functions

Do not introduce another backend platform.

---

## AI

Google Gemini

Used for

* Student AI
* Mentor AI
* AI Insights
* AI Feedback
* AI Summaries

Gemini must only be called from secure backend execution.

Never expose API Keys.

---

## Communication

Resend

Used for

* Welcome Emails
* Session Reminders
* Application Updates
* Notifications

---

## Calendar

Google Calendar API

Used for

* Session Scheduling
* Calendar Sync

---

## Meetings

Google Meet

Used for

* Meeting Link Creation

---

## Analytics

PostHog

Track meaningful product events only.

---

## Monitoring

Sentry

Used for

* Error Monitoring
* Crash Reports
* Performance Monitoring

---

# Official Architecture

Users

↓

React Application

↓

TanStack Query

↓

Service Layer

↓

Supabase

↓

External Services

↓

Database

Every feature must follow this flow.

Never bypass the Service Layer.

---

# Service Layer Rules

Every feature must have its own service.

Examples

AuthService

StudentService

MentorService

GoalService

ProgramService

TaskService

JournalService

BookingService

CalendarService

NotificationService

MessageService

AnalyticsService

AIService

StorageService

EmailService

Components must never communicate directly with Supabase.

---

# Folder Structure

The project must remain feature-oriented.

src/

app/

pages/

routes/

components/

features/

services/

hooks/

types/

utils/

lib/

constants/

supabase/

migrations/

edge-functions/

seed/

docs/

Avoid giant folders.

Avoid dumping unrelated code into shared directories.

---

# Database Rules

Primary Database

Supabase PostgreSQL

Requirements

* UUID Primary Keys
* Foreign Keys
* Indexes
* Constraints
* Normalized Tables
* created_at
* updated_at
* Soft Delete when appropriate

Never duplicate data unnecessarily.

---

# Authentication

Use Supabase Auth.

Never build authentication manually.

Supported

* Email Login
* Password Reset
* Session Management
* JWT
* Email Verification (optional)

---

# Authorization

All authorization must use Row Level Security.

Never trust frontend permissions.

Security belongs in the database.

---

# Storage

Use Supabase Storage.

Students

Only access their own files.

Mentors

Only access files they are authorized to view.

---

# Realtime

Use Supabase Realtime only when necessary.

Examples

Messaging

Notifications

Dashboard Updates

Session Updates

Do not create unnecessary subscriptions.

---

# Edge Functions

Edge Functions exist only for secure operations.

Allowed

Google Gemini

Google Calendar

Google Meet

Resend

Scheduled Jobs

Not Allowed

Simple CRUD

Fetching Records

Updating Student Profiles

Reading Lists

Simple CRUD must communicate directly with Supabase using Row Level Security.

---

# State Management

Server State

TanStack Query

Local UI State

React

Authentication

React Context

Avoid unnecessary global state.

---

# Security

Mandatory

HTTPS

JWT Authentication

Row Level Security

Environment Variables

Secure Secrets

Database Constraints

Input Validation

Audit Logs

Soft Deletes

Never expose

Gemini Keys

Google Secrets

Resend Keys

Supabase Service Role Key

---

# Performance

Always

* Lazy Loading
* Code Splitting
* Pagination
* Database Indexes
* React Query Cache
* Optimistic Updates

Avoid

Loading unnecessary data

Large realtime subscriptions

Repeated AI calls

Large monolithic components

---

# AI Usage

Gemini should only be used when it adds value.

Cache AI-generated content whenever possible.

Never send duplicate requests.

Never expose Gemini credentials to the browser.

---

# Free Tier Optimization

The application must remain optimized for Free Tier usage.

### Vercel

Use only for

* Frontend Hosting
* CI/CD

Avoid serverless functions whenever possible.

### Supabase

Use

* PostgreSQL
* Auth
* Storage
* Realtime
* Edge Functions

Only create Edge Functions for secure operations.

### Google APIs

Create Calendar events only after booking confirmation.

Create Meet links only after confirmation.

### PostHog

Track meaningful events only.

Avoid excessive event logging.

---

# Backup Strategy

## Source Code

Developer

↓

Git

↓

GitHub

↓

Vercel

---

## Database

Supabase PostgreSQL

↓

Daily Automated Backup

↓

Google Drive

---

## Storage

Supabase Storage

↓

Weekly Backup

↓

Google Drive

---

## Environment Variables

Maintain an encrypted offline backup.

Never rely only on Vercel.

---

## Monthly Backup

Once every month

* Database Backup
* Storage Backup

Store outside the cloud.

---

# Disaster Recovery

If Supabase becomes unavailable

Restore latest PostgreSQL backup

↓

Restore Storage Backup

↓

Deploy to another PostgreSQL provider

↓

Update Environment Variables

↓

Continue operation

The application must remain portable.

---

# Vendor Lock-In Policy

Never couple business logic directly to Supabase.

Only Services communicate with Supabase.

Future migration should require changing only the service layer.

---

# Development Standards

Every feature must include

* UI
* Types
* Service
* Validation
* Loading State
* Empty State
* Error State
* Success State

No dead buttons.

No inaccessible pages.

No broken navigation.

No placeholder screens.

No incomplete workflows.

---

# Code Quality Standards

* Keep components focused and modular.
* Prefer reusable components over duplication.
* Keep business logic out of React components.
* Keep services single-purpose.
* Maintain consistent naming conventions.
* Use TypeScript strictly.
* Prefer composition over large monolithic files.

---

# Final Engineering Rule

Before implementing any feature, ask:

1. Does this follow the serverless architecture?
2. Does this work within free-tier limits?
3. Does this avoid unnecessary complexity?
4. Does this preserve the service-layer architecture?
5. Does this improve maintainability?
6. Is this secure by default?
7. Can this still scale to approximately 1,000 students?
8. Can this be migrated later without major rewrites?

If the answer to any of these questions is **No**, redesign the implementation before writing code.

This architecture is the official engineering standard for Mentorino and should be treated as non-negotiable unless explicitly updated.
