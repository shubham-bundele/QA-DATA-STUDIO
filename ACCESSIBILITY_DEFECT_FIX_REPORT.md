# Accessibility Defect Fix Report

**Date:** 2026-08-13
**Scope:** 6 Axe-Core violations (Defects 1–6)

---

## Defect 1: User Profile generator — `label` (critical)

| Field | Value |
|-------|-------|
| **ID** | AXE-01 |
| **Original failure** | `<input type="number">` (record count) has no accessible name |
| **Root cause** | Number input was rendered without `id` or `aria-label`; the visible heading "Record Count" was not programmatically linked |
| **File changed** | `src/app/(app)/generators/user-profile/page.tsx` |
| **Fix applied** | Added `id="record-count"` and `aria-label="Record count"` to the Input element |
| **Additional fix** | Slider `<span role="slider">` (Thumb) was also missing an accessible name. Fixed by forwarding `aria-label` from Slider Root to Slider Thumb in `src/components/ui/slider.tsx` |
| **Test evidence** | Axe-Core scan passes with 0 critical/serious violations |
| **Final status** | FIXED |

## Defect 2: Address generator — `button-name` (critical)

| Field | Value |
|-------|-------|
| **ID** | AXE-02 |
| **Original failure** | Radix Select trigger `<button role="combobox">` (country selector) has no accessible name |
| **Root cause** | `<SelectTrigger>` had no `aria-label`; the visible heading "Country" was not linked |
| **File changed** | `src/app/(app)/generators/address/page.tsx` |
| **Fix applied** | Added `aria-label="Country"` to `<SelectTrigger>`. Added `id="record-count"` and `aria-label="Record count"` to the number input. Fixed Slider Thumb propagation globally. |
| **Test evidence** | Axe-Core scan passes with 0 critical/serious violations |
| **Final status** | FIXED |

## Defect 3: Credit Card generator — `label` + `color-contrast` (critical/serious)

| Field | Value |
|-------|-------|
| **ID** | AXE-03 |
| **Original failure** | (1) Number input missing label. (2) Test-data disclaimer banner had `text-warning` on `bg-warning/10` with contrast ratio 1.97:1 |
| **Root cause** | (1) Same as AXE-01. (2) Warning color token (#f59f0a) has insufficient contrast against its own light background |
| **File changed** | `src/app/(app)/generators/credit-card/page.tsx`, `src/components/ui/slider.tsx` |
| **Fix applied** | (1) Added `id="record-count"` and `aria-label="Record count"`. (2) Changed disclaimer from `border-warning/50 bg-warning/10 text-warning` to `border-border bg-muted text-foreground` for sufficient contrast in both themes |
| **Test evidence** | Axe-Core scan passes with 0 critical/serious violations |
| **Final status** | FIXED |

## Defect 4: Banking generator — `button-name` (critical)

| Field | Value |
|-------|-------|
| **ID** | AXE-04 |
| **Original failure** | Two Radix Select triggers (country, currency) missing accessible names |
| **Root cause** | `<SelectTrigger>` elements had no `aria-label` |
| **File changed** | `src/app/(app)/generators/banking/page.tsx` |
| **Fix applied** | Added `aria-label="Country"` and `aria-label="Currency"` to respective SelectTrigger elements. Added `id="record-count"` and `aria-label="Record count"` to number input. |
| **Test evidence** | Axe-Core scan passes with 0 critical/serious violations |
| **Final status** | FIXED |

## Defect 5: Schema Intelligence — `label` (critical)

| Field | Value |
|-------|-------|
| **ID** | AXE-05 |
| **Original failure** | `<input type="number">` (records per category) has no accessible name |
| **Root cause** | `<label>` element existed but had no `htmlFor`; input had no `id` |
| **File changed** | `src/app/(app)/schema/page.tsx` |
| **Fix applied** | Added `htmlFor="schema-record-count"` to label and `id="schema-record-count"` to input |
| **Test evidence** | Axe-Core scan passes with 0 critical/serious violations |
| **Final status** | FIXED |

## Defect 6: Settings — `color-contrast` (serious)

| Field | Value |
|-------|-------|
| **ID** | AXE-06 |
| **Original failure** | "Danger Zone" heading (`text-destructive`, #ef4343) on white background has contrast ratio 3.78:1. Destructive button (#fafafa on #ef4343) has contrast ratio 3.62:1. Both below the 4.5:1 WCAG AA threshold. |
| **Root cause** | Light-mode `--destructive` token `0 84% 60%` (HSL) produces a red too bright for white backgrounds |
| **File changed** | `src/app/globals.css` |
| **Fix applied** | Changed `--destructive` from `0 84% 60%` to `0 72% 42%`, producing a darker red (~#b81f1f) with contrast ratio ~6.4:1 on white and ~5.8:1 for white text on the red background |
| **Test evidence** | Axe-Core scan passes with 0 serious violations |
| **Final status** | FIXED |

---

## Global Fix: Slider Thumb Accessibility

| Field | Value |
|-------|-------|
| **File** | `src/components/ui/slider.tsx` |
| **Root cause** | Radix `<Slider.Root>` received `aria-label` but did not forward it to `<Slider.Thumb>` (the actual `role="slider"` element). Axe correctly flagged the thumb as missing a name. |
| **Fix** | Destructured `aria-label` from Root props, passed it explicitly to the Thumb component |
| **Impact** | Fixes all 4 generator pages and any future Slider usage |
