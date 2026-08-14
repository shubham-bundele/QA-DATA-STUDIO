# DESIGN SYSTEM COMPLIANCE — QA Data Studio

**Date:** 2026-08-13

---

## Token Usage

All components use semantic CSS custom properties via Tailwind utility classes. No hard-coded hex values found in application components.

| Token Category | Usage | Compliance |
|---------------|-------|:----------:|
| Background colors | `bg-background`, `bg-card`, `bg-muted`, `bg-primary` | OK |
| Text colors | `text-foreground`, `text-muted-foreground`, `text-primary` | OK |
| Border colors | `border-border`, `border-input` | OK |
| Accent/ring | `ring-ring`, `bg-accent` | OK |
| Destructive | `text-destructive`, `bg-destructive` | OK |
| Success/Warning/Info | `text-success`, `bg-warning`, `text-info` | OK |
| Sidebar tokens | `bg-sidebar-background`, `text-sidebar-foreground` | OK |
| Chart tokens | `--chart-1` through `--chart-5` | Defined, not yet used (dashboard charts not implemented) |

## Typography

| Element | Font | Weight | Compliance |
|---------|------|--------|:----------:|
| Body text | Geist Sans (`--font-sans`) | 400 | OK |
| Code/data output | Geist Mono (`--font-mono`) | 400 | OK |
| Headings | Geist Sans | 600-700 | OK |
| UI labels | Geist Sans | 500 | OK |

## Spacing Consistency

| Pattern | Value | Usage |
|---------|-------|-------|
| Card padding | `p-6` | Consistent across all cards |
| Section gap | `gap-4` to `gap-8` | Consistent |
| Page padding | `p-6 lg:p-8` | Consistent in app layout |

## Component Variants

| Component | Variants Used | Compliance |
|-----------|--------------|:----------:|
| Button | default, outline, ghost, destructive, link | OK — all via CVA |
| Badge | default, secondary, outline, success, warning, info | OK |
| Card | Standard only | OK |
| Input | Standard only | OK |

## Issues Found and Fixed

| ID | Issue | Fix |
|----|-------|-----|
| DS-01 | Footer copyright hard-coded to "2024" | Changed to `{new Date().getFullYear()}` |
| DS-02 | Marketing pages claimed "6 export formats" | Corrected to "3 Export Options" |
| DS-03 | Features page listed TSV format | Removed TSV entry |
| DS-04 | FAQ and About pages mentioned TSV | Text corrected |

## Non-Blocking Observations

| ID | Observation | Impact |
|----|-------------|--------|
| DS-NB1 | Schema page uses some inline variant strings instead of CVA variant props | Out of MVP scope |
| DS-NB2 | `bg-primary/5`, `bg-primary/8`, `bg-primary/10`, `bg-primary/20` — multiple opacity levels | Intentional for visual depth, not inconsistent |
