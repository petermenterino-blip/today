# Realtime Stability Report

## Test Suite: `e2e/realtime.spec.ts`

### Pre-Fix Results (2026-07-06)
| Test | Result | Duration |
|------|--------|----------|
| mentor sends message, student1 receives it | ✅ (false positive) | 4.4s |
| student1 replies, mentor receives it | ❌ intermittent | 28.1s |
| reconnect after page refresh | ✅ | 6.7s |
| navigation between tabs does not cause page errors | ✅ | 10.4s |

**Overall:** 3/4 passed (1 intermittent failure)

### Post-Fix Results (2026-07-06) — 5 Consecutive Iterations

#### Iteration 1
| Test | Result | Duration |
|------|--------|----------|
| mentor sends message, student1 receives it | ✅ | 6.9s |
| student1 replies, mentor receives it | ✅ | 16.1s |
| reconnect after page refresh | ✅ | 9.9s |
| navigation between tabs does not cause page errors | ✅ | 11.2s |

#### Iteration 2
| Test | Result | Duration |
|------|--------|----------|
| mentor sends message, student1 receives it | ✅ | 7.5s |
| student1 replies, mentor receives it | ✅ | 15.5s |
| reconnect after page refresh | ✅ | 9.5s |
| navigation between tabs does not cause page errors | ✅ | 10.8s |

#### Iteration 3
| Test | Result | Duration |
|------|--------|----------|
| mentor sends message, student1 receives it | ✅ | 7.1s |
| student1 replies, mentor receives it | ✅ | 16.6s |
| reconnect after page refresh | ✅ | 10.2s |
| navigation between tabs does not cause page errors | ✅ | 11.0s |

#### Iteration 4
| Test | Result | Duration |
|------|--------|----------|
| mentor sends message, student1 receives it | ✅ | 6.5s |
| student1 replies, mentor receives it | ✅ | 15.3s |
| reconnect after page refresh | ✅ | 9.6s |
| navigation between tabs does not cause page errors | ✅ | 11.1s |

#### Iteration 5
| Test | Result | Duration |
|------|--------|----------|
| mentor sends message, student1 receives it | ✅ | 7.8s |
| student1 replies, mentor receives it | ✅ | 15.5s |
| reconnect after page refresh | ✅ | 7.4s |
| navigation between tabs does not cause page errors | ✅ | 10.8s |

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total iterations | 5 |
| Total tests run | 20 |
| Total passed | 20 |
| Total failed | 0 |
| **Success rate** | **100%** |
| Average test suite duration | ~68s |
| Average test 2 (student→mentor) duration | 15.8s |

### Test 2 (Previously Failing) Timing Breakdown
| Run | Duration |
|-----|----------|
| 1 | 16.1s |
| 2 | 15.5s |
| 3 | 16.6s |
| 4 | 15.3s |
| 5 | 15.5s |
| **Average** | **15.8s** |
| **Std Dev** | **0.5s** |

### Conclusion
The previously intermittent test is now **deterministic** and passes consistently in <17 seconds per iteration. The fix addresses the root cause (missing conversation auto-selection + incorrect test locators) rather than masking timing issues.
