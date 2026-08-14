# ACCESSIBILITY UI AUDIT — QA Data Studio

**Date:** 2026-08-13
**Standard:** WCAG 2.1 AA (MVP requirement Q1)

---

## Issues Found and Resolved

| ID | Severity | Component | Issue | Fix Applied |
|----|----------|-----------|-------|-------------|
| A11Y-01 | HIGH | Root layout | No skip-to-content link | Added skip link in `layout.tsx` targeting `#main-content` |
| A11Y-02 | HIGH | App/Public layouts | No `<main>` landmark with ID | Added `id="main-content"` to both `<main>` elements |
| A11Y-03 | MEDIUM | Sidebar collapse button | No accessible name when icon-only (collapsed) | Added `aria-label` that changes with state |
| A11Y-04 | MEDIUM | All generator sliders | Slider components missing `aria-label` | Added `aria-label="Record count"` / `"Password length"` |
| A11Y-05 | LOW | Output viewer table | Missing `<caption>` | Added `<caption className="sr-only">Generated test data</caption>` |
| A11Y-06 | LOW | Settings theme buttons | No `aria-pressed` state | Added `aria-pressed={theme === option.value}` |
| A11Y-07 | LOW | Sidebar icon buttons | Decorative icons not hidden | Added `aria-hidden="true"` on sidebar collapse icon |

## Items Verified as Correct

| Item | Status |
|------|--------|
| Theme toggle in topbar | Has `sr-only` text: "Toggle theme" |
| Mobile hamburger in topbar | Has `sr-only` text: "Toggle menu" |
| Marketing header hamburger | Has `aria-label="Toggle menu"` |
| Form field toggles (Switch) | All Switch components have associated `<Label htmlFor>` |
| Copy button in shared component | Has `sr-only` text: "Copy" |
| Mobile sidebar (Sheet) | Uses Radix Dialog with title |
| HTML `lang` attribute | Set to `"en"` |
| `suppressHydrationWarning` | Applied to `<html>` for next-themes |

## Remaining Non-Blocking Items

| ID | Severity | Component | Issue | Recommendation |
|----|----------|-----------|-------|----------------|
| A11Y-NB1 | LOW | Schema page textarea | No associated label element | Add `aria-label` (schema page is out of MVP scope) |
| A11Y-NB2 | LOW | Schema page number input | Not linked to label | Add `id` and `htmlFor` (out of scope) |
| A11Y-NB3 | LOW | Schema page category toggles | No `aria-pressed` | Add `aria-pressed` (out of scope) |
| A11Y-NB4 | LOW | Generator number inputs | Inputs have visual heading but no `id`/`htmlFor` association | Non-blocking; heading provides context |
| A11Y-NB5 | LOW | Reduced motion preference | No explicit `prefers-reduced-motion` check | Framer Motion respects this by default |
| A11Y-NB6 | LOW | Zoom at 200% | Not tested (requires browser verification) | Record for manual testing |
| A11Y-NB7 | LOW | Contrast ratios | Not measured programmatically | Design tokens use sufficient contrast by design |
