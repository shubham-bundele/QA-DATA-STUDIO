# Mobile Schema Control Fix

**Date:** 2026-08-13
**Defect:** Schema Intelligence category buttons overflow on Pixel 5 (390x844) viewport
**Status:** MOBILE DEFECT VERIFIED FIXED

---

## Defect Description

On the Pixel 5 viewport (390x844), the Schema Intelligence results panel rendered four category buttons (Positive, Negative, Boundary, Security) plus two action buttons (Copy, Export) in a single non-wrapping flex row. The Security button was pushed outside the viewport and unreachable without horizontal page-level scrolling.

## Root Cause

In `src/app/(app)/schema/page.tsx`, the results `CardHeader` used:
```
<div className="flex items-center justify-between">
  <div className="flex gap-1.5">
```

Both containers lacked `flex-wrap`, forcing all 6 buttons onto a single row regardless of viewport width.

## Fix Applied

**File:** `src/app/(app)/schema/page.tsx`
**Change:** Added `flex-wrap` and `gap-2` to allow graceful wrapping:

```
<div className="flex flex-wrap items-center justify-between gap-2">
  <div className="flex flex-wrap gap-1.5">
```

- On narrow viewports (320–390px), category buttons wrap to a second row
- On wide viewports (1024px+), all buttons remain on one row — desktop layout unchanged
- Action buttons (Copy, Export) remain aligned to the right
- No changes to button sizes, text, accessible names, or selected state

## Verification

| Viewport | All 4 categories visible | No horizontal overflow | Security reachable |
|----------|:------------------------:|:---------------------:|:------------------:|
| 320px | Yes (wrapped) | Yes | Yes |
| 375px | Yes (wrapped) | Yes | Yes |
| 390px (Pixel 5) | Yes (wrapped) | Yes | Yes |
| 768px | Yes (single row) | Yes | Yes |
| 1024px+ | Yes (single row) | Yes | Yes |

## Dashboard History Finding

The Dashboard history section renders below the fold on the Pixel 5 viewport. The AUTOMATION_PHASE_1_FINAL_VERIFICATION.md documents this as: "The data is present and correct; it requires scrolling to see."

This is expected responsive behavior for a page with stats cards, quick actions, and history stacked vertically in a single-column mobile layout. No change was made to the dashboard. The history data is accessible through normal vertical scrolling.

The persistence test failure on mobile-chrome is caused by the generators not writing to IndexedDB history — a functional gap unrelated to viewport layout.
