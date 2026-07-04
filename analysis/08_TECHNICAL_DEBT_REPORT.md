

# Phase 8: Technical Debt Report

## Debt Inventory

### Critical Debt
| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 1 | 5 empty dashboard tabs render nothing | `pages/Dashboard/` | User confusion, incomplete UX | 2-3 days |
| 2 | 3 Edge Functions have zero auth | `supabase/functions/{calendar,gemini,meet}/` | Security vulnerability | 1 day |
| 3 | Analytics drill-downs are stubs | `pages/Analytics/` | Missing business insight | 1-2 days |
| 4 | No staleTime on ~29/30 query hooks | All `hooks/*.ts` | Network waste on every mount | 0.5 day |

### High Debt
| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 5 | No code splitting | `src/App.tsx` routing | Large initial bundle | 0.5 day |
| 6 | Inconsistent error handling | Various services/hooks | Some errors silently swallowed | 1-2 days |
| 7 | No empty states on list pages | Various pages | Poor UX when data absent | 1 day |
| 8 | Hardcoded strings remain in some components | Various pages | Maintenance burden | 1 day |
| 9 | Settings integrations tab empty | `pages/Settings/` | Feature not delivered | 1 day |
| 10 | No React.memo on list items | Various list components | Unnecessary re-renders | 0.5 day |

### Medium Debt
| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 11 | Mixed error pattern (try/catch vs .catch vs throw) | All services | Developer confusion | 2 days |
| 12 | No request deduplication on dashboard | `pages/Dashboard/` | Parallel query blast | 0.5 day |
| 13 | No service worker | `vite.config.ts` | No offline/speed benefit | 1 day |
| 14 | No component unit tests | Entire app | Regression risk | 5-10 days |
| 15 | noUnusedLocals not enabled | `tsconfig.json` | Dead code risk | 0.5 day |

### Low Debt
| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 16 | No bundle analysis configured | `package.json` | Unknown bundle composition | 0.25 day |
| 17 | No image optimization pipeline | Build config | Larger images than needed | 0.5 day |
| 18 | Accessibility gaps | Throughout | Legal/compliance risk | 3-5 days |
| 19 | No responsive testing | Throughout | Mobile experience inconsistent | 2-3 days |

## Debt Summary
| Category | Count | Estimated Effort |
|----------|-------|------------------|
| Critical | 4 | 4.5-7 days |
| High | 6 | 5-8 days |
| Medium | 5 | 9-14 days |
| Low | 4 | 5.75-8.75 days |
| **Total** | **19 items** | **24-38 days** |

## Technical Debt Ratio
- Estimated debt paydown: 24-38 person-days
- Estimated codebase size: ~35,000 lines
- Debt ratio: ~7-11% (acceptable for early-stage; concerning for production)

## Priority Recommendation
1. Fix security debt (Edge Function auth) — 1 day, critical risk
2. Add staleTime to all queries — 0.5 day, high ROI
3. Implement empty states + stable loading patterns — 2 days, UX impact
4. Code splitting — 0.5 day, performance
5. Dashboard and Analytics tabs — 3-5 days, feature completeness
