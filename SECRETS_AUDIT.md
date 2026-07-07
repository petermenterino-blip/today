# Secrets Audit Report

**Date:** 2026-07-06
**Audit scope:** `.env*`, `scripts/`, `config/`, git-tracked files

---

## VERIFIED Issues

### 1. `.env.staging` contains real secrets — not gitignored

**File:** `.env.staging`
**Status:** `VERIFIED | FIXED`
**Secrets found:**
- `SUPABASE_SERVICE_ROLE_KEY` — real staging Supabase service role key
- `VITE_SUPABASE_URL` — real staging project URL
- `VITE_SUPABASE_ANON_KEY` — real staging anon key

**Why it's a problem:** This file was NOT in `.gitignore`. While `git ls-files` confirmed it is not currently tracked, any future `git add .` would commit it to history.

**Fix applied:** Added to `.gitignore`:
- `.env` — entire env file
- `.env.staging` — staging secrets
- `.env.production` — production template (placeholder values, but good practice)
- `.env.local.bak` — backup with real secrets

### 2. `.env.local.bak` contains same secrets — not gitignored

**File:** `.env.local.bak`
**Status:** `VERIFIED | FIXED`
**Fix applied:** Same as above — added to `.gitignore`.

### 3. Hardcoded service role JWT fallback in seed script

**File:** `scripts/seedAuthUsers.ts:12`
**Status:** `VERIFIED | FIXED`
**Finding:** Hardcoded Supabase service role JWT (`eyJ...`) as fallback when `SUPABASE_SERVICE_ROLE_KEY` env var is not set.

**Fix applied:** Removed the hardcoded fallback. Script now exits with fatal error if `SUPABASE_SERVICE_ROLE_KEY` is not set.

### 4. Hardcoded QA user passwords in seed script

**File:** `scripts/seedAuthUsers.ts:23,28,33`
**Status:** `VERIFIED | FIXED`
**Finding:** QA user passwords hardcoded as fallbacks:
- `STAGING_MENTOR_PASSWORD` fallback: `'Mentorino-QA-Mentor-2026'`
- `STAGING_STUDENT1_PASSWORD` fallback: `'Mentorino-QA-Student1-2026'`
- `STAGING_STUDENT2_PASSWORD` fallback: `'Mentorino-QA-Student2-2026'`

**Fix applied:** Moved all to environment variables. Script now exits with fatal error if any are missing.

---

## NOT VERIFIED (previously reported, no longer an issue)

| Previous Finding | Why Resolved |
|---|---|
| `.env.local` committed secrets | Already gitignored via `*.local` pattern |
| `.env.production` real secrets | Contains only placeholder values (`xxxxxxxx...`) |
| `.env` file secrets | Not present in repository |

---

## NOT VERIFIED (by design)

| Previous Finding | Why Resolved |
|---|---|
| `VITE_SUPABASE_ANON_KEY` in client bundle | Public anon key — required by Supabase client. This is safe when rate-limited at the API level. |
| Supabase URL in client bundle | Required for Supabase client connection. No security impact. |

---

## Verification

- `.env.staging` — `git ls-files` confirmed not tracked; now in `.gitignore`
- `.env.local.bak` — confirmed not tracked; now in `.gitignore`
- `scripts/seedAuthUsers.ts` — no hardcoded secrets remain (verified by source read)

**Validation:**
- `npm run build` — PASS (exit 0)
- `npm run lint` — PASS (exit 0)
- `tsc --noEmit` — PASS (exit 0)
