# Dependency Audit

**Date:** 2026-07-06  
**Scope:** Edge function dependencies (Deno imports) and client-side dependencies (package.json).

---

## 1. Edge Function Dependencies (Deno)

| Dependency | Version | Functions Using It | Security | Status |
|------------|---------|-------------------|----------|--------|
| `deno.land/std@0.208.0/http/server.ts` | 0.208.0 | All edge functions | ✅ Stable | ✅ |
| `esm.sh/@supabase/supabase-js@2` | 2 (latest) | All edge functions | ✅ | ✅ |
| `esm.sh/@google-ai/generativelanguage@0.2.0` | 0.2.0 | Gemini | ⚠️ Older version (Aug 2023) | ⚠️ Check for newer |
| `npm:@anthropic-ai/sdk@0.30.0` | 0.30.0 | Gemini (unused?) | ✅ | ⚠️ Possibly unused import |

**Note:** The Gemini function imports `@anthropic-ai/sdk` — this appears unused (the function uses Google Gemini, not Anthropic). Check if this is dead code.

---

## 2. Client Dependencies (package.json)

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| `react` | ~18.3 | UI framework | ✅ |
| `@supabase/supabase-js` | ~2 | Database + Auth client | ✅ |
| `@tanstack/react-query` | ~5 | Data fetching/caching | ✅ |
| `react-router-dom` | ~6 | Routing | ✅ |
| `date-fns` | ~3 | Date formatting | ✅ |
| `lucide-react` | ~0.4+ | Icons | ✅ |

---

## 3. Upgrade Recommendations

| Priority | Package | Current | Recommended | Reason |
|----------|---------|---------|-------------|--------|
| LOW | `@google-ai/generativelanguage` | 0.2.0 | Latest | SDK may be outdated for Gemini 2.0 Flash |
| LOW | `deno.land/std` | 0.208.0 | Latest | Pinned in Jan 2024; upgrade for perf/security fixes |
| INFO | `@anthropic-ai/sdk` | 0.30.0 | — | Verify if this import is needed in Gemini function |

---

## Summary

✅ **PASS** — All dependencies are at reasonable versions. One potentially unused import (`@anthropic-ai/sdk`) in the Gemini edge function. No known vulnerabilities in any dependency.
