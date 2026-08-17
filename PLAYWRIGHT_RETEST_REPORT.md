# Playwright Retest Report

**Date:** 2026-08-13

---

## Desktop (chromium project): 41/41 PASSED

| Suite | Tests | Result |
|-------|:-----:|:------:|
| Smoke | 13 | 13 passed |
| Schema Intelligence | 6 | 6 passed |
| Downloads | 2 | 2 passed |
| Persistence | 4 | 4 passed |
| Accessibility (Axe-Core) | 9 | 9 passed |
| Mobile (mobile.spec.ts in chromium) | 7 | 7 passed |
| **Total** | **41** | **41 passed** |

Duration: 1.1 minutes

## Previously Failing Tests — All Fixed

| # | Test | Previous | Current |
|---|------|:--------:|:-------:|
| 1 | User Profile generator has no critical or serious violations | FAIL | PASS |
| 2 | Address generator has no critical or serious violations | FAIL | PASS |
| 3 | Credit Card generator has no critical or serious violations | FAIL | PASS |
| 4 | Banking generator has no critical or serious violations | FAIL | PASS |
| 5 | Schema Intelligence has no critical or serious violations | FAIL | PASS |
| 6 | Settings has no critical or serious violations | FAIL | PASS |
| 7 | invalid schema input produces error state | FAIL | PASS |

## Mobile Viewport (mobile-chrome project): 38/41

3 pre-existing failures in the `mobile-chrome` project are NOT related to the 7 defect fixes. These occur because the `smoke.spec.ts` and `persistence.spec.ts` tests use `locator('aside')` to find the desktop sidebar, which is hidden at mobile viewport widths (`hidden lg:block`). The dedicated `mobile.spec.ts` file (which uses the mobile drawer instead) passes 7/7.

| Failure | Root Cause |
|---------|-----------|
| sidebar navigation works | `aside` not visible at mobile width |
| dashboard reads real history after generation | Test navigates via sidebar which is hidden |
| displays security warning for security category | Test navigates via sidebar which is hidden |

These are test-viewport compatibility issues, not application defects. They existed before this fix round.
