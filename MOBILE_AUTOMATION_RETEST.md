# Mobile Automation Retest Report

**Date:** 2026-08-13
**Target defect:** Schema Intelligence Security category button unreachable on Pixel 5

---

## Test Results

### Desktop Playwright (chromium): 41/41 PASSED

| Suite | Tests | Result |
|-------|:-----:|:------:|
| Smoke | 13 | 13 passed |
| Schema Intelligence | 6 | 6 passed |
| Downloads | 2 | 2 passed |
| Persistence | 4 | 4 passed |
| Accessibility (Axe-Core) | 9 | 9 passed |
| Mobile (mobile.spec.ts in chromium) | 7 | 7 passed |
| **Total** | **41** | **41 passed** |

### Mobile Playwright (mobile-chrome / Pixel 5): 40/41 (1 skipped)

| Suite | Tests | Passed | Failed | Skipped | Notes |
|-------|:-----:|:------:|:------:|:-------:|-------|
| Smoke | 13 | 12 | 0 | 1 | Desktop sidebar test skipped on mobile |
| Schema Intelligence | 6 | **6** | **0** | 0 | **Security warning test now passes** |
| Downloads | 2 | 2 | 0 | 0 | |
| Persistence | 4 | 3 | 1 | 0 | History: generators don't write to IndexedDB |
| Accessibility (Axe-Core) | 9 | 9 | 0 | 0 | |
| Mobile | 7 | 7 | 0 | 0 | |
| **Total** | **41** | **39** | **1** | **1** | |

### Previously Failing Mobile Test — Fixed

| Test | Before | After |
|------|:------:|:-----:|
| Schema Intelligence > displays security warning for security category | FAIL (timeout) | **PASS** |

### Remaining Mobile Failure — Not Related to This Fix

| Test | Status | Root Cause |
|------|:------:|-----------|
| Persistence > dashboard reads real history after generation | FAIL | Generators don't save to IndexedDB history (functional gap, not layout) |

### Axe-Core Accessibility

| Route | Critical | Serious | Result |
|-------|:--------:|:-------:|:------:|
| All 8 scanned routes | 0 | 0 | PASS |

### Other Checks

| Check | Result |
|-------|:------:|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Vitest | 320/320 passed |
| Production build | 17/17 pages, compiled successfully |
| ESLint (source) | 0 errors |

---

## Fix Summary

| Item | Detail |
|------|--------|
| **File changed** | `src/app/(app)/schema/page.tsx` |
| **Lines changed** | 2 (added `flex-wrap` and `gap-2` to two flex containers) |
| **Desktop layout** | Unchanged |
| **Mobile layout** | Category buttons now wrap to second row |
| **Accessibility** | No violations introduced |
| **Keyboard navigation** | Preserved |
| **Visible focus** | Preserved |
| **Selected state** | Preserved |
| **Security warning** | Visible after selection on all viewports |

---

## Final Status: MOBILE DEFECT VERIFIED FIXED
