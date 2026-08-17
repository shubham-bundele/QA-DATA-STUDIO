# UI RELEASE BLOCKERS — QA Data Studio

**Date:** 2026-08-13
**Authority:** UI Verification Audit

---

## Critical Blockers (Must Fix Before Release)

### NONE REMAINING

All critical issues identified during this audit have been resolved:

| ID | Issue | Status | Fix |
|----|-------|:------:|-----|
| UB-01 | No credit card test-data disclaimer | **FIXED** | Added `role="alert"` banner with "Test Data Only — Not Valid for Transactions" |
| UB-02 | US and India shown as IBAN countries | **FIXED** | IBAN toggle disabled for US/IN with "(not used in {country})" label |
| UB-03 | Export button was a non-functional stub | **FIXED** | Wired to real `exportData` + `triggerDownload` with JSON/CSV dropdown |
| UB-04 | No skip-to-content link | **FIXED** | Added in root layout, targets `#main-content` |
| UB-05 | Dashboard showed hardcoded fake stats | **FIXED** | Wired to IndexedDB analytics via `getTotals()` |
| UB-06 | Footer contained dead `#` links | **FIXED** | Removed GitHub placeholder, changed Documentation to "Getting Started" → `/faq` |

---

## Non-Blocking Issues (Tracked, Do Not Block Release)

| ID | Severity | Issue | Route | Recommendation |
|----|----------|-------|-------|----------------|
| NB-01 | LOW | No SSN range enforcement (900-999) in generator | `/generators/user-profile` | Synthetic warning added; range enforcement is Phase 2 |
| NB-02 | LOW | Schema page accessibility gaps (textarea label, button states) | `/schema` | Schema page is not in any MVP phase |
| NB-03 | LOW | Generator record count inputs not programmatically linked to heading labels | All generators | Heading provides visual context; add `id`/`htmlFor` in Phase 2 |
| NB-04 | LOW | Dashboard chart not implemented (Recharts imported but unused) | `/dashboard` | Phase 2 feature |
| NB-05 | LOW | Contact page has no `<title>` metadata (client component) | `/contact` | Non-MVP page |
| NB-06 | MEDIUM | Settings export format and record count don't affect generator defaults | `/settings` | Values persist to localStorage; wiring to generators is Phase 2 |
| NB-07 | LOW | Zoom at 200% not browser-tested | All routes | Record for manual testing session |

---

## Scope Alignment Notes

### Routes Present But Out of MVP Scope

Per MVP_SCOPE_LOCK.md Section 1.2, the MVP defines 11 routes. The current implementation has additional routes that are NOT in MVP scope. These extra routes are functional and do not break anything, but their presence is a scope deviation:

| Extra Route | MVP Status | Risk |
|-------------|-----------|------|
| `/features` | Not in scope | Low — informational, harmless |
| `/faq` | Not in scope | Low — informational, harmless |
| `/about` | Explicitly deferred (CTO Ruling #2) | Low — page exists, should not be in header nav per scope |
| `/contact` | Not in scope | Low — informational, harmless |
| `/dashboard` | Phase 2 | Medium — now wired to real data; functional |
| `/settings` | Phase 2 (P2-23) | Low — theme works, persistence added |
| `/schema` | Not in any phase | Medium — functional but completely out of scope |
| `/generators/banking` | Phase 2 (P2-01) | Medium — functional with IBAN fix applied |

### Missing MVP Routes

| Missing Route | MVP ID | Impact |
|---------------|--------|--------|
| `/generators` | P2 | HIGH — Generator hub page not implemented |
| `/generators/json` | P6/G4 | HIGH — JSON Sample generator not implemented |
| `/generators/csv` | P7/G5 | HIGH — CSV Dataset generator not implemented |
| `/disclaimer` | P10 | MEDIUM — Standalone disclaimer page not implemented |

**These missing routes are scope gaps, not UI bugs.** They represent features that were never built. This audit verifies the UI of what exists, not whether all MVP features were implemented.
