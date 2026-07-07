# CAPACITY_REPORT.md

**Date:** 2026-07-06  
**Analyst:** Performance Engineer

---

## Architecture Overview

| Component | Service | Capacity Constraint |
|-----------|---------|-------------------|
| Frontend | Vercel (Static) | CDN — essentially unlimited |
| Database | Supabase (Postgres) | 500MB free, 8GB $25/mo, 256GB $499/mo |
| Auth | Supabase Auth | 50K MAU free, 100K $25/mo |
| Storage | Supabase Storage | 1GB free, 100GB $25/mo |
| Realtime | Supabase Realtime | 2M messages free, 10M $25/mo |
| Email | Resend | 100/day free, 50K/mo $20 |
| AI | Gemini | 60 requests/min free |
| Edge Functions | Supabase | 500K invocations free, 2M $25/mo |

---

## Load Estimates

### 10 Users

| Resource | Usage | Feasibility |
|----------|-------|-------------|
| DB connections | ~1-2 concurrent | ✅ Free tier |
| Storage | ~50-500 MB | ✅ Free tier |
| Realtime | ~100-500 msg/day | ✅ Free tier |
| Edge Functions | ~50-200 calls/day | ✅ Free tier |
| Gemini | ~20-100 calls/day | ✅ Free tier |
| Resend | ~5-20 emails/day | ✅ Free tier (within 100/day) |
| Bandwidth | ~1-5 GB/month | ✅ Free tier |

**Verdict:** ✅ Runs comfortably on free tier.

### 100 Users

| Resource | Usage | Feasibility |
|----------|-------|-------------|
| DB connections | ~5-15 concurrent | ✅ $25/mo Pro tier |
| Storage | ~500 MB - 2 GB | ⚠️ May exceed free 1GB — upgrade to $25/mo |
| Realtime | ~1K-5K msg/day | ✅ Free tier (2M/month) |
| Edge Functions | ~500-2K calls/day | ✅ Free tier (500K/month) |
| Gemini | ~200-1K calls/day | ⚠️ ~30K/mo — free tier (60/min = 86K/mo theoretical) |
| Resend | ~50-200 emails/day | ⚠️ Exceeds 100/day free — upgrade to $20/mo |
| Bandwidth | ~10-50 GB/month | ✅ $25/mo Pro tier (50GB) |

**Verdict:** ⚠️ Need Pro Supabase ($25/mo) + Resend paid ($20/mo).

### 500 Users

| Resource | Usage | Feasibility |
|----------|-------|-------------|
| DB connections | ~25-75 concurrent | ✅ $25/mo (100 connections) |
| Storage | ~2-10 GB | ⚠️ Pro tier 8GB — may exceed |
| Realtime | ~5K-25K msg/day | ✅ Free tier (150K/month) |
| Edge Functions | ~2.5K-10K calls/day | ⚠️ ~300K/mo — approaching 500K/mo limit |
| Gemini | ~1K-5K calls/day | ⚠️ 150K/mo — free tier 60/min = 86K/mo max theoretical |
| Resend | ~250-1K emails/day | ✅ Resend $20/mo (50K/mo) |
| Bandwidth | ~50-250 GB/month | ⚠️ Exceeds Pro 50GB — overage or upgrade |

**Verdict:** ⚠️ Multiple services approaching limits. Need Supabase Pro + Resend paid + Gemini monitoring.

### 1000 Users

| Resource | Usage | Feasibility |
|----------|-------|-------------|
| DB connections | ~50-150 concurrent | ⚠️ May exceed Pro (100) — need Team tier |
| Storage | ~10-20 GB | ❌ Exceeds Pro 8GB — Team tier |
| Realtime | ~10K-50K msg/day | ✅ Pro tier (10M/month) |
| Edge Functions | ~5K-20K calls/day | ✅ Pro tier (2M/month) |
| Gemini | ~2K-10K calls/day | ❌ 300K/mo — exceeds free tier. Need Gemini paid |
| Resend | ~500-2K emails/day | ✅ Resend $55/mo (500K/mo) |
| Bandwidth | ~100-500 GB/month | ❌ Exceeds Pro 250GB — Team tier $599/mo |

**Verdict:** ❌ Need Supabase Team tier ($599/mo) + Resend paid + Gemini paid.

### 5000 Users

| Resource | Usage | Feasibility |
|----------|-------|-------------|
| DB connections | ~250-750 concurrent | ❌ Need Team tier (160) or Enterprise |
| Storage | ~50-200 GB | ✅ Team tier (100GB) or Enterprise |
| Realtime | ~50K-250K msg/day | ✅ Team tier (25M/month) |
| Edge Functions | ~25K-100K calls/day | ✅ Team tier (10M/month) |
| Gemini | ~10K-50K calls/day | ❌ 1.5M/mo — need Gemini paid API |
| Resend | ~2.5K-10K emails/day | ✅ Resend enterprise |
| Bandwidth | ~500 GB - 2.5 TB/month | ❌ Team tier 500GB — may exceed |

**Verdict:** ❌ Requires Enterprise planning.

---

## Bottlenecks

| # | Bottleneck | Breaks At | Mitigation |
|---|-----------|-----------|------------|
| 1 | **Gemini free tier** | ~100 users (heavy AI use) | Switch to stable model, cache responses, queue requests |
| 2 | **Resend free tier** | ~50-100 users | Upgrade to paid tier ($20/mo) |
| 3 | **Supabase DB size** | ~200-500 users | Upgrade to Team tier, archive old data |
| 4 | **Supabase bandwidth** | ~500-1000 users | Optimize images, enable CDN caching |
| 5 | **Edge Function invocations** | ~1000 users | Batch operations, reduce polling |
| 6 | **JWT size** | ~5000+ profiles | Keep custom claims minimal |
| 7 | **Realtime channel limit** | ~500 concurrent users | Use presence judiciously |

---

## Scaling Recommendations

| Priority | Action | Timeline |
|----------|--------|----------|
| HIGH | Upgrade to Supabase Pro ($25/mo) | At 50+ users |
| HIGH | Upgrade Resend to paid ($20/mo) | At 50+ users |
| MEDIUM | Add Redis caching for AI responses | At 200+ users |
| MEDIUM | Implement query pagination everywhere | Before 500 users |
| LOW | Add CDN caching for static assets | Before 1000 users |
| LOW | Database read replicas | At 2000+ users |

---

## Summary

```
╔══════════════════════════════════════════════════════════════╗
║  CAPACITY: ✅ ACCEPTABLE — Free tier viable for launch      ║
║                                                             ║
║  10-50 users:  Free tier                                     ║
║  50-200 users: Supabase Pro ($25) + Resend ($20)            ║
║  200-1000 users: Supabase Team ($599) + Gemini paid         ║
║  1000+ users: Enterprise planning required                   ║
╚══════════════════════════════════════════════════════════════╝
```
