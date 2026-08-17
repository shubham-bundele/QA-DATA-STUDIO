# Axe-Core Retest Report

**Date:** 2026-08-13
**Tool:** @axe-core/playwright
**Standard:** WCAG 2.1 AA

---

## Results: 0 Critical, 0 Serious Violations on All Tested Routes

| Route | Critical | Serious | Result |
|-------|:--------:|:-------:|:------:|
| `/` (Landing) | 0 | 0 | PASS |
| `/dashboard` | 0 | 0 | PASS |
| `/generators/user-profile` | 0 | 0 | PASS |
| `/generators/address` | 0 | 0 | PASS |
| `/generators/credit-card` | 0 | 0 | PASS |
| `/generators/banking` | 0 | 0 | PASS |
| `/schema` | 0 | 0 | PASS |
| `/settings` | 0 | 0 | PASS |

## Violations Fixed

| Rule | Impact | Routes Fixed | Fix |
|------|--------|-------------|-----|
| `button-name` | Critical | Address, Banking | Added `aria-label` to Radix SelectTrigger components |
| `label` | Critical | All generators, Schema | Added `id` + `aria-label` to number inputs; added `htmlFor` + `id` to schema label/input pair |
| `aria-required-name` (slider) | Serious | All generators | Forwarded `aria-label` from Slider Root to Slider Thumb in component |
| `color-contrast` | Serious | Settings | Darkened `--destructive` token from `0 84% 60%` to `0 72% 42%` |
| `color-contrast` | Serious | Credit Card | Changed disclaimer banner from warning colors to neutral muted/foreground |

## Skip-to-content Verification

| Check | Result |
|-------|--------|
| Link exists | Yes — `<a href="#main-content">Skip to main content</a>` |
| Target exists | Yes — `<main id="main-content">` on both layouts |
| Visible on focus | Yes — `focus:not-sr-only` styling |
