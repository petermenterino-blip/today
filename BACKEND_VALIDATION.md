# Backend Validation Report

**Supabase Project:** mentarino-staging  
**Date:** 2026-07-06

---

## Service Responsiveness (Live Tested)

| Service | Endpoint | Response | Status |
|---------|----------|----------|--------|
| Auth | `GET /auth/v1/settings` | 200 OK | ✅ |
| REST API | `GET /rest/v1/profiles?select=count` | 200 OK | ✅ |
| Realtime | WebSocket upgrade | 101 Switching | ✅ |
| Edge Functions | `GET /functions/v1/` | Reachable | ✅ |
| Storage | `GET /storage/v1/bucket` | Reachable | ✅ |

---

## API Latency (from Playwright execution)

| Operation | Average | Max Acceptable | Status |
|-----------|---------|----------------|--------|
| Profile fetch | ~2s | <5s | ✅ |
| Goal list (with milestones join) | ~3s | <5s | ✅ |
| Task list (with join) | ~4s | <5s | ✅ |
| Message send | ~2s | <5s | ✅ |
| Application list | ~3s | <5s | ✅ |
| Application approval | ~5s | <10s | ✅ |

---

## Error Handling

| Scenario | Client | Server | Status |
|----------|--------|--------|--------|
| Invalid JWT | 401 handled | JWT verification | ✅ |
| Missing auth | 401 redirect | 401 response | ✅ |
| Rate limit exceeded | 429 handled | 429 response | ✅ |
| Database timeout | Loading state | Error response | ✅ |
| Network offline | OfflineBanner | N/A | ✅ |

---

## Edge Function Latency

| Function | Average | Notes |
|----------|---------|-------|
| gemini (AI chat) | ~2-5s | Depends on prompt complexity |
| approve-application | ~3-8s | Multi-step provisioning |
| resend (email) | ~1-2s | Resend API latency |
| scheduled (cron) | N/A | Background execution |

---

## Summary

✅ **PASS** — All backend services responsive. Error handling covers 401, 429, timeout, and offline scenarios. No latency issues detected.
