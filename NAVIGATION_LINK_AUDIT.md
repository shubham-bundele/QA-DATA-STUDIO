# NAVIGATION LINK AUDIT — QA Data Studio

**Date:** 2026-08-13

---

## All Navigation Sources

### Marketing Header (`components/marketing/header.tsx`)
| Link | Target | Exists | MVP Scope |
|------|--------|:------:|:---------:|
| Logo | `/` | Yes | In scope |
| Features | `/features` | Yes | Out of scope (harmless) |
| FAQ | `/faq` | Yes | Out of scope (harmless) |
| About | `/about` | Yes | Out of scope (CTO Ruling #2: deferred) |
| Contact | `/contact` | Yes | Out of scope |
| Open App (CTA) | `/dashboard` | Yes | Out of scope (Phase 2) |

### Marketing Footer (`components/marketing/footer.tsx`)
| Link | Target | Exists | Status |
|------|--------|:------:|--------|
| Logo | `/` | Yes | OK |
| Features | `/features` | Yes | OK |
| FAQ | `/faq` | Yes | OK |
| Dashboard | `/dashboard` | Yes | OK |
| About | `/about` | Yes | OK |
| Contact | `/contact` | Yes | OK |
| Privacy | `/privacy` | Yes | OK |
| Terms | `/terms` | Yes | OK |
| Getting Started | `/faq` | Yes | **FIXED** — was dead `#` (Documentation) |
| ~~GitHub~~ | ~~`#`~~ | N/A | **REMOVED** — was dead `#` link |

### Sidebar Navigation (`config/navigation.ts`)
| Link | Target | Exists | MVP Scope |
|------|--------|:------:|:---------:|
| Dashboard | `/dashboard` | Yes | Phase 2 |
| Schema Intelligence | `/schema` | Yes | Not in any phase scope |
| User Profile | `/generators/user-profile` | Yes | In scope (G1) |
| Address | `/generators/address` | Yes | In scope (G2) |
| Credit Card | `/generators/credit-card` | Yes | In scope (G3) |
| Banking | `/generators/banking` | Yes | Phase 2 (P2-01) |
| Settings | `/settings` | Yes | Phase 2 (P2-23) |

### 404 Page
| Link | Target | Exists |
|------|--------|:------:|
| Go Home | `/` | Yes |
| Open Dashboard | `/dashboard` | Yes |

## Broken Links Summary

| Before Fix | After Fix |
|-----------|-----------|
| Footer "Documentation" → `#` | Changed to "Getting Started" → `/faq` |
| Footer "GitHub" → `#` | Removed entirely |
| FAQ `<a href="/contact">` (not using Next.js Link) | Changed to `<Link href="/contact">` |

**Status: No broken links remain.**
