# Free Tier Capacity Estimation — Mentorino

> **Tiers evaluated:** Supabase Free, Vercel Free, Resend Free  
> **Current user base:** ~500 MAU (estimated)  
> **Document purpose:** Model growth limits and identify which constraint hits first.

---

## 1. Supabase Free Tier Limits

| Resource | Limit | Est. Current Use | Headroom |
|----------|-------|-----------------|----------|
| Database | 500 MB | 50 MB | 450 MB (90%) |
| Bandwidth | 5 GB/month | 500 MB | 4.5 GB (90%) |
| Monthly Active Users | 50,000 | 500 | 49,500 (99%) |
| Edge Functions | 500k invocations/month | 1,720 | 498,280 (99.6%) |
| Realtime Connections | 500 concurrent | 50 | 450 (90%) |
| Realtime Messages | 2 million/month | 100,000 | 1.9M (95%) |
| Storage | 1 GB | 100 MB | 900 MB (90%) |
| Storage Bandwidth | 5 GB/month | 500 MB | 4.5 GB (90%) |

## 2. Verge Free Tier Limits

| Resource | Limit | Est. Current Use | Headroom |
|----------|-------|-----------------|----------|
| Bandwidth | 100 GB/month | 1 GB | 99 GB (99%) |
| Build Minutes | 6,000/month | 300 | 5,700 (95%) |
| Serverless Invocations | 100/day | 0 | 100 (100%) |
| Edge Function Invocations | — | — | N/A (uses Supabase) |

## 3. Resend Free Tier Limits

| Resource | Limit | Est. Current Use | Headroom |
|----------|-------|-----------------|----------|
| Emails/day | 100 | 30 | 70 (70%) |
| Emails/month | 3,000 | 900 | 2,100 (70%) |

---

## 4. Growth Projections

### Scenario A: Moderate Growth (2× users/quarter)

| Quarter | MAU | DB (MB) | BW (GB) | Emails/day | Emails/month | Realtime Conns | Bottleneck? |
|---------|-----|---------|---------|------------|-------------|---------------|-------------|
| Current | 500 | 50 | 0.5 | 30 | 900 | 50 | — |
| Q3 2026 | 1,000 | 100 | 1.0 | 60 | 1,800 | 100 | — |
| Q4 2026 | 2,000 | 200 | 2.0 | 120 | 3,600 | 200 | **Resend (3k/mo)** |
| Q1 2027 | 4,000 | 400 | 4.0 | 240 | 7,200 | 400 | Resend + near DB BW |
| Q2 2027 | 8,000 | **800** | 8.0 | 480 | 14,400 | **800** | **DB (500MB)** + Realtime (500) |

**First bottleneck:** Resend at **~1,000 MAU** (3,000 emails/month ceiling).  

### Scenario B: Rapid Growth (5× users/quarter)

| Quarter | MAU | DB (MB) | BW (GB) | Emails/day | Emails/month | Conns | Bottleneck? |
|---------|-----|---------|---------|------------|-------------|-------|-------------|
| Current | 500 | 50 | 0.5 | 30 | 900 | 50 | — |
| Q3 2026 | 2,500 | 250 | 2.5 | 150 | 4,500 | 250 | **Resend (3k/mo)** |
| Q4 2026 | 12,500 | **1,250** | 12.5 | 750 | 22,500 | **1,250** | **DB (500MB)** + Realtime (500) |

**First bottleneck:** Resend at **~1,700 MAU**.  

---

## 5. Per-User Resource Consumption

| Activity | DB Cost | BW Cost | Email Cost | Realtime Cost |
|----------|---------|---------|-----------|---------------|
| New user signup | 2 KB | — | 1 email (welcome) | — |
| Daily session (mentor) | 10 KB | 1 MB | — | 1 channel |
| Send message | 1 KB | — | — | 1 realtime msg |
| Upload avatar | 5 KB | 50 KB | — | — |
| Upload gallery image | 15 KB | 200 KB | — | — |
| Weekly progress email | 1 KB | — | 1 email | — |
| Session reminder | 1 KB | — | 1 email | — |
| Browse mentor dashboard | 500 KB | 3 MB | — | 25 channels |
| Browse student dashboard | 300 KB | 2 MB | — | 15 channels |

---

## 6. Safe Operating Limits (Free Tier)

| Constraint | Safe Limit | How to Stay Under |
|-----------|-----------|-------------------|
| **MAU** | **25,000** | Supabase Free allows 50k; stay at 50% for buffer |
| **Database** | **250 MB** | Enable TTL on messages (auto-delete >90 days) |
| **Bandwidth (Supabase)** | **2.5 GB/month** | Enable image CDN caching, compress all uploads |
| **Bandwidth (Vercel)** | **50 GB/month** | Static assets are <5 MB; mostly API responses |
| **Emails (Resend)** | **50/day, 1,500/month** | Batch notifications, reduce non-critical emails |
| **Realtime Connections** | **250 concurrent** | Limit channels per user to 10; reuse channels |
| **Realtime Messages** | **1 million/month** | Currently at 5% usage — comfortable |
| **Edge Functions** | **250,000/month** | Currently at 0.3% — comfortable |
| **Storage** | **500 MB** | Compress files, delete orphaned storage files |

---

## 7. Scaling Pathway (When to Upgrade)

### 7.1 First Upgrade: Resend Pro ($20/mo)

**Trigger:** 1,000 MAU or 100 emails/day  
**What you get:** 50,000 emails/month, dedicated IP, analytics  
**Why first:** Resend Free is the tightest constraint (100/day, 3k/month).

### 7.2 Second Upgrade: Supabase Pro ($25/mo)

**Trigger:** 5,000 MAU or 250 MB database or 250 concurrent Realtime connections  
**What you get:** 8 GB database, 50 GB bandwidth, 100k MAU, 2M realtime msgs  
**Why second:** DB and Realtime hit their ceiling next.

### 7.3 Third Upgrade: Optimize Before Vercel

**Vercel Free is sufficient** until 50 GB/month bandwidth. Static SPA serves 2-5 MB per full page load. At 50 GB/month headroom, this handles **10,000-25,000 full page loads/month**.

---

## 8. Capacity Formula

```
Max MAU = min(
    Supabase MAU Limit × 0.5,           // 25,000
    (Resend Monthly Limit / Emails per user per month),  // 3,000 / 1.8 = ~1,667
    (Supabase DB Limit / DB per user),                   // 500 MB / 0.1 MB = 5,000
    (Realtime Connections / Channels per user),          // 500 / 25 = 20
)
```

**Effective max MAU on Free Tier (current architecture):** **~20 concurrent dashboard users** (limited by Realtime channels per user).

**Effective max MAU with optimizations (target 10 channels/user):** **50 concurrent users**.

---

## 9. Recommended Free Tier Budget

| Component | Monthly Budget (Free Tier) | Keep Below |
|-----------|---------------------------|------------|
| Supabase DB | 500 MB | 400 MB |
| Supabase BW | 5 GB | 4 GB |
| Supabase Storage | 1 GB | 800 MB |
| Supabase Storage BW | 5 GB | 4 GB |
| Supabase Edge Functions | 500k invocations | 400k |
| Supabase Realtime Conns | 500 | 400 |
| Vercel BW | 100 GB | 80 GB |
| Vercel Build Minutes | 6,000 min | 5,000 min |
| Resend Emails | 3,000/month | 2,500/month |

---

## 10. Key Takeaway

**The Resend Free tier (3,000 emails/month) is the tightest constraint.** At 1.8 emails/user/month (welcome + reminders + summaries), the platform caps at **~1,667 MAU** before needing Resend Pro. The second constraint is **Realtime connections** at 25+ channels per dashboard user, capping concurrent active users at **~20**.

To maximize free tier runway:
1. Reduce email volume (batch summaries, reduce reminder frequency)
2. Reduce Realtime channels per user (reuse channels, filter server-side)
3. Add TTL-based cleanup for messages and notifications
4. Monitor Supabase database size monthly
