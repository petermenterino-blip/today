# Phase 10: Next Phase Roadmap

## Strategic Priorities

### Phase N1 — Security Hardening (Week 1) 🔴

| Task | Effort | Impact | Dependencies |
|------|--------|--------|-------------|
| N1.1 Add JWT auth to calendar Edge Function | 0.5 day | Security | None |
| N1.2 Add JWT auth to gemini Edge Function | 0.5 day | Security | None |
| N1.3 Add JWT auth to meet Edge Function | 0.5 day | Security | None |
| N1.4 Audit all service mutations for role checks | 1 day | Defense-in-depth | None |
| **Total** | **2.5 days** | | |

### Phase N2 — Performance Optimization (Week 1-2) 🟡

| Task | Effort | Impact | Dependencies |
|------|--------|--------|-------------|
| N2.1 Add staleTime: 5min to all ~30 query hooks | 0.5 day | Network reduction | None |
| N2.2 Add React.lazy() code splitting for 6 largest pages | 0.5 day | Bundle size | None |
| N2.3 Add React.memo to list item components | 0.5 day | Render perf | None |
| N2.4 Add keepPreviousData to paginated queries | 0.5 day | UX smoothness | None |
| N2.5 Add bundle analysis to CI | 0.25 day | Monitoring | None |
| **Total** | **2.25 days** | | |

### Phase N3 — Feature Completeness (Week 2-3) 🟡

| Task | Effort | Impact | Dependencies |
|------|--------|--------|-------------|
| N3.1 Fill 5 empty dashboard tabs | 2-3 days | UX | None |
| N3.2 Fill analytics drill-downs | 1-2 days | Business insight | None |
| N3.3 Complete student detail view | 1 day | UX | None |
| N3.4 Settings integrations tab | 1 day | UX | None |
| **Total** | **5-7 days** | | |

### Phase N4 — Quality & Testing (Week 3-4) 🟢

| Task | Effort | Impact | Dependencies |
|------|--------|--------|-------------|
| N4.1 Add empty states to list pages | 1 day | UX | None |
| N4.2 Standardize error handling pattern | 2 days | Reliability | None |
| N4.3 Set up testing framework (Vitest) | 0.5 day | Foundation | None |
| N4.4 Write service layer unit tests | 3-5 days | Coverage | N4.3 |
| N4.5 Add error boundaries | 1 day | UX | None |
| **Total** | **7.5-9.5 days** | | |

### Phase N5 — Infrastructure & Release (Week 4) 🔵

| Task | Effort | Impact | Dependencies |
|------|--------|--------|-------------|
| N5.1 Set up CI/CD pipeline | 1-2 days | Automation | None |
| N5.2 Add error tracking (Sentry) | 0.5 day | Observability | None |
| N5.3 Configure staging environment | 1 day | Release | None |
| N5.4 Security audit (pen test) | 2-3 days | Compliance | N1 |
| N5.5 Performance audit (Lighthouse CI) | 0.5 day | Baseline | None |
| **Total** | **5-7 days** | | |

## Timeline Overview
```
Week 1:    N1 ████████████  N2 ████████
Week 2:    N2 ██████        N3 ████████████████████
Week 3:    N3 ████████████  N4 ████████████████████
Week 4:    N4 ████████████  N5 ████████████████████
```

Total estimated effort: **22-28 days** (~5-6 weeks with 1 developer)

## Risk Factors
1. **Scope creep** — Dashboard tabs could expand as requirements clarify
2. **Testing velocity** — First-time test setup always takes longer than estimated
3. **Infrastructure unknowns** — CI/CD setup depends on hosting provider (Supabase + Vercel assumed)
4. **No dedicated QA** — All testing done by developer

## Success Criteria for Production Release
- [ ] All 3 unprotected edge functions have JWT auth
- [ ] staleTime configured on all query hooks
- [ ] Empty dashboard tabs filled
- [ ] Error tracking (Sentry) operational
- [ ] CI/CD pipeline passing
- [ ] Service layer test coverage ≥30%
- [ ] No critical/high-severity security findings
- [ ] Lighthouse Performance score ≥80
- [ ] Staging environment matching production
- [ ] Rollback plan documented
