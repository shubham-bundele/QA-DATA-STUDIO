# ROUTE VERIFICATION MATRIX — QA Data Studio

**Date:** 2026-08-13
**Scope:** All implemented routes verified against MVP_SCOPE_LOCK.md

---

## Route Status

| # | Route | Page Title | Load | Nav Source | Mobile | Empty State | MVP Status | Notes |
|---|-------|-----------|:----:|-----------|:------:|:-----------:|:----------:|-------|
| 1 | `/` | Landing page | OK | Direct / Logo | OK | N/A | **IN SCOPE** (P1) | Hero, features, stats, CTA |
| 2 | `/features` | Features | OK | Header nav | OK | N/A | **OUT OF SCOPE** | Not in MVP_SCOPE_LOCK — informational, low risk |
| 3 | `/faq` | FAQ | OK | Header nav | OK | N/A | **OUT OF SCOPE** | Not in MVP_SCOPE_LOCK — informational, low risk |
| 4 | `/about` | About | OK | Header nav, footer | OK | N/A | **OUT OF SCOPE** | CTO Ruling #2: deferred to Phase 2. Page exists but should not be in nav per scope lock |
| 5 | `/contact` | Contact | OK | Header nav, footer | OK | N/A | **OUT OF SCOPE** | Not in MVP_SCOPE_LOCK |
| 6 | `/privacy` | Privacy Policy | OK | Footer | OK | N/A | **IN SCOPE** (P8) | Static content |
| 7 | `/terms` | Terms of Service | OK | Footer | OK | N/A | **IN SCOPE** (P9) | Static content |
| 8 | `/dashboard` | Dashboard | OK | Sidebar, CTA | OK | Yes | **OUT OF SCOPE** | Phase 2 per MVP_SCOPE_LOCK. Now wired to real IndexedDB data |
| 9 | `/generators/user-profile` | User Profile Generator | OK | Sidebar | OK | Yes | **IN SCOPE** (P3/G1) | All fields functional |
| 10 | `/generators/address` | Address Generator | OK | Sidebar | OK | Yes | **IN SCOPE** (P4/G2) | Country selector works |
| 11 | `/generators/credit-card` | Credit Card Generator | OK | Sidebar | OK | Yes | **IN SCOPE** (P5/G3) | Disclaimer added |
| 12 | `/generators/banking` | Banking Generator | OK | Sidebar | OK | Yes | **OUT OF SCOPE** | Phase 2 (P2-01). IBAN validation added |
| 13 | `/settings` | Settings | OK | Sidebar | OK | N/A | **OUT OF SCOPE** | Phase 2 (P2-23). Theme works, persistence added |
| 14 | `/schema` | Schema Intelligence | OK | Sidebar | OK | Yes | **OUT OF SCOPE** | Not in any MVP phase |
| 15 | `/*` (404) | Not Found | OK | Any bad URL | OK | N/A | **IN SCOPE** (P11) | Links to Home and Dashboard |

## Missing MVP Routes

| Route | MVP ID | Status |
|-------|--------|--------|
| `/generators` | P2 | **NOT IMPLEMENTED** — Generator hub page with grid of cards |
| `/generators/json` | P6/G4 | **NOT IMPLEMENTED** — JSON Sample generator |
| `/generators/csv` | P7/G5 | **NOT IMPLEMENTED** — CSV Dataset generator |
| `/disclaimer` | P10 | **NOT IMPLEMENTED** — General test data disclaimer page |

## Navigation Link Audit

### Links to Non-MVP Routes (present but harmless)
- Header: `/features`, `/faq`, `/about`, `/contact` — pages exist, just out of MVP scope
- Footer: `/about`, `/contact`, `/features`, `/faq`, `/dashboard` — pages exist
- Sidebar: `/schema` — page exists, not in any scope

### Broken Links (FIXED)
- Footer "Documentation" (`#`) — Changed to `/faq` (Getting Started)
- Footer "GitHub" (`#`) — Removed
- FAQ page `<a href="/contact">` — Changed to `<Link href="/contact">`

### No Dead Links Remaining
All navigation links point to existing, loading routes.
