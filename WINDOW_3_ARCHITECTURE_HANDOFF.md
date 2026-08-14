# QA Data Studio — Architecture Handoff (Window 3)

Status: **ARCHITECTURE VERIFIED WITH OPEN RELEASE BLOCKERS**
Build: **Next.js production build passes (17/17 pages, 0 TypeScript errors)**
Date: 2026-08-13

---

## 1. Final Architecture Overview

QA Data Studio is a **Next.js 16 application** that generates realistic test data entirely in the browser. There is no separate backend, no API routes, no paid database, and no required AI service.

**Deployment model:**

- Next.js application (App Router)
- Client-side test-data generation (all generators run in browser via `@faker-js/faker`)
- Browser-based persistence (IndexedDB via `idb`, LocalStorage for settings)
- No separate backend
- No application API routes
- No paid database
- No required AI service
- Vercel compatible (standard Next.js deployment, not static export)

**Important:** The application is NOT configured as a static export. `next.config.ts` does not set `output: "export"`. The build output is a standard Next.js server-rendered application with prerendered static pages. Vercel serves it as a Next.js app, not a static file host.

---

## 2. Complete Implemented Module Inventory

### 2.1 Core Layer (`src/core/`)

| File | Purpose |
|---|---|
| `core/types/common.ts` | Shared TypeScript types: ExportFormat, GeneratorType, CreditCardNetwork, AccountType, SqlDialect, PayloadFieldType, GenerationMeta |
| `core/constants/limits.ts` | Safety limits: MAX_RECORDS=1000, MAX_PAYLOAD_RECORDS=500, MAX_EXPORT_RECORDS=5000, MAX_PAYLOAD_FIELDS=50, MAX_NESTED_DEPTH=3, MAX_HISTORY_ENTRIES=100 |
| `core/constants/defaults.ts` | Default values for all configurable options |
| `core/utils/luhn.ts` | Luhn algorithm: `calculateLuhnCheckDigit()`, `isLuhnValid()` |
| `core/utils/iban.ts` | IBAN generation: `generateIBAN()`, `formatIBAN()` with mod-97 check digits |
| `core/utils/random.ts` | Random utilities: `randomInt()`, `randomFloat()`, `randomPick()`, `weightedPick()`, `shuffleArray()`, `generateId()` |

### 2.2 Schema Intelligence Engine (`src/core/engines/`)

| File | Purpose |
|---|---|
| `engines/types.ts` | Type definitions for the schema engine |
| `engines/string-utils.ts` | String analysis utilities |
| `engines/pattern-matching.ts` | Pattern matching for field detection |
| `engines/field-classification.ts` | Field type classification |
| `engines/schema-detection.ts` | Schema structure detection |
| `engines/boundary-engine.ts` | Boundary value analysis |
| `engines/security-engine.ts` | Security pattern detection |
| `engines/relationship-engine.ts` | Field relationship analysis |
| `engines/validation-engine.ts` | Validation rule generation |
| `engines/orchestrator.ts` | Orchestrates all engine components |
| `engines/index.ts` | Public API barrel export |

### 2.3 Feature Modules (`src/features/`)

Each generator follows a 3-file pattern: `*.types.ts`, `*.validation.ts`, `*.service.ts`.

| Generator | Files | Key Capabilities |
|---|---|---|
| **Users** | `features/users/user.{types,validation,service}.ts` | Names, emails (custom domains), phones, DOBs, ages, genders, usernames, passwords (mixed character classes), avatars, SSNs. Seed support. |
| **Addresses** | `features/addresses/address.{types,validation,service}.ts` | Streets, cities, states (filterable), zip codes, countries (8 supported), counties, lat/lng, full formatted addresses. Seed support. |
| **Banking** | `features/banking/banking.{types,validation,service}.ts` | Bank names (15 curated), account numbers, ABA routing numbers (valid checksum), SWIFT codes (valid structure), IBANs (mod-97 check digits), account types, balances, currencies. Seed support. |
| **Credit Cards** | `features/credit-cards/credit-card.{types,validation,service}.ts` | Luhn-valid card numbers for 5 networks (Visa, Mastercard, Amex, Discover, Diners), card holders, expiry dates (future or expired), CVVs (3 or 4 digit), network names, issuers. Formatted output. Seed support. |
| **Payloads** | `features/payloads/payload.{types,validation,service}.ts` | User-defined schemas with 17 field types, recursive nesting (max depth 3), edge case injection (XSS, SQL injection, boundary values), JSON and XML output. Seed support. |

### 2.4 Export Engine (`src/features/export/`)

| File | Purpose |
|---|---|
| `export/export.types.ts` | ExportConfig, ExportResult, ExportOptions types |
| `export/export.service.ts` | `exportData()` selects formatter, `triggerDownload()` creates blob and triggers browser download |
| `export/formatters/formatter.interface.ts` | `IFormatter` contract: `format()`, `mimeType`, `fileExtension`, `encoding` |
| `export/formatters/json.formatter.ts` | JSON with configurable pretty-print and indentation |
| `export/formatters/csv.formatter.ts` | CSV with nested object flattening, configurable delimiter, quoting, headers |
| `export/formatters/xml.formatter.ts` | XML with nested element support, configurable root/record elements, pretty-print |
| `export/formatters/sql.formatter.ts` | SQL with type inference, CREATE TABLE, INSERT INTO, configurable dialect (MySQL/Postgres/SQLite), DROP IF EXISTS |

### 2.5 Client Storage (`src/client/`)

| File | Purpose |
|---|---|
| `client/storage/indexed-db.service.ts` | IndexedDB database definition via `idb`. Tables: templates, history, analytics. Lazy singleton via `getDB()`. |
| `client/storage/local-storage.service.ts` | Typed LocalStorage wrapper with `qds_` prefix. Keys: theme, locale, recent_gen, onboarding. SSR-safe (checks `typeof window`). |
| `client/models/template.model.ts` | Template interface: id, name, description, generatorType, config, timestamps, tags |
| `client/models/history-entry.model.ts` | HistoryEntry interface: id, generatorType, config, recordCount, generatedAt, preview, exportedAs |
| `client/models/analytics.model.ts` | AnalyticsCounter interface with per-generator and per-format breakdowns. `createEmptyAnalytics()` factory. |
| `client/repositories/template.repository.ts` | Template CRUD: getAll, getById, getByType, create, update, delete, search |
| `client/repositories/history.repository.ts` | History CRUD: getAll, getById, getByGenerator, add (auto-prunes to 100 entries), clear |
| `client/repositories/analytics.repository.ts` | Analytics tracking: recordGeneration, recordExport, getTotals, getDailyStats, reset. Tracks both total and daily counters. |

### 2.6 UI Layer (`src/components/`, `src/app/`)

| Area | Key Files |
|---|---|
| **Root layout** | `app/layout.tsx` — ThemeProvider, TooltipProvider, Toaster |
| **App layout** | `app/(app)/layout.tsx` — Sidebar, Topbar, mobile sidebar |
| **Public layout** | `app/(public)/layout.tsx` — Marketing header/footer |
| **Generator pages** | `app/(app)/generators/{user-profile,address,credit-card,banking}/page.tsx` |
| **Other app pages** | `app/(app)/dashboard/page.tsx`, `app/(app)/settings/page.tsx`, `app/(app)/schema/page.tsx` |
| **Marketing pages** | `app/(public)/{page,features,about,contact,faq,privacy,terms}/page.tsx` |
| **Shared components** | `components/generators/`, `components/layout/`, `components/shared/`, `components/ui/` |
| **Config** | `config/site.ts`, `config/navigation.ts` |
| **State** | `stores/sidebar-store.ts` (Zustand) |
| **Hooks** | `hooks/use-copy-clipboard.ts` |
| **Types** | `types/generator.ts`, `types/export.ts` |

---

## 3. Generator Data Flow

```
User interacts with generator page (React client component)
    │
    ├── Form state managed by react-hook-form
    │
    ├── User clicks "Generate"
    │
    ├── Form values validated by Zod schema (e.g., userGenerateSchema)
    │   └── Invalid → form error displayed, generation blocked
    │
    ├── Service function called directly in browser
    │   e.g., generateUsers(validatedConfig)
    │   └── @faker-js/faker generates data in-memory
    │   └── Custom algorithms run (Luhn, ABA routing, IBAN mod-97)
    │   └── Returns { records: TypedRecord[], meta: GenerationMeta }
    │
    ├── Records rendered in OutputViewer component
    │
    ├── History entry saved to IndexedDB
    │   historyRepository.addHistoryEntry({ generatorType, config, recordCount, preview })
    │
    └── Analytics counter incremented in IndexedDB
        analyticsRepository.recordGeneration(generatorType, recordCount)
```

No network requests occur during generation. All computation is in-browser.

---

## 4. Storage Data Flow

```
IndexedDB ("qa-data-studio" database, version 1)
    │
    ├── templates store
    │   ├── keyPath: "id"
    │   ├── indexes: by-generator, by-name, by-created
    │   └── CRUD via template.repository.ts
    │
    ├── history store
    │   ├── keyPath: "id"
    │   ├── indexes: by-generator, by-date
    │   ├── Auto-prunes to MAX_HISTORY_ENTRIES (100) on each add
    │   └── CRUD via history.repository.ts
    │
    └── analytics store
        ├── keyPath: "id"
        ├── Two record types: "total" (all-time) and "YYYY-MM-DD" (daily)
        └── Increment via analytics.repository.ts

LocalStorage (lightweight settings only)
    ├── qds_theme → "light" | "dark" | "system"
    ├── qds_locale → default locale preference
    ├── qds_recent_gen → last generator type used
    └── qds_onboarding → "complete" | "pending"
```

All repositories use `getDB()` from `indexed-db.service.ts`, which lazily opens the database and caches the connection.

---

## 5. Export Data Flow

```
User clicks export format button (JSON, CSV, XML, SQL)
    │
    ├── exportData({ data: records, format, options }) called
    │   ├── Selects IFormatter by format key
    │   ├── Formatter.format(data, options) produces output string
    │   └── Returns ExportResult { output, format, encoding, filename, mimeType, byteSize }
    │
    ├── triggerDownload(result) called
    │   ├── Creates Blob from output string (or base64-decoded bytes)
    │   ├── Creates object URL via URL.createObjectURL()
    │   ├── Creates temporary <a> element with download attribute
    │   ├── Triggers click → browser downloads file
    │   └── Revokes object URL to free memory
    │
    └── Analytics counter incremented
        analyticsRepository.recordExport(format)
```

No server involvement. The entire export pipeline runs in the browser.

---

## 6. Validation Data Flow

```
Form input (react-hook-form)
    │
    ├── Zod schema defines constraints
    │   ├── count: z.number().int().min(1).max(MAX_RECORDS)
    │   ├── fields: z.object({ fieldName: z.boolean().default(true/false) })
    │   ├── options: z.object({ ... }).default({})
    │   └── Nested schemas for complex inputs (payload field definitions)
    │
    ├── @hookform/resolvers/zod bridges Zod to react-hook-form
    │
    ├── Validation runs on form submit
    │   ├── Valid → service.generate() called with typed, validated data
    │   └── Invalid → field-level errors rendered in form
    │
    └── Zod schemas also serve as TypeScript type source
        e.g., type UserGenerateConfig = z.infer<typeof userGenerateSchema>
```

---

## 7. Client and Server Component Boundaries

```
SERVER COMPONENTS (rendered on server at build time or request time)
    ├── src/app/layout.tsx (root layout)
    ├── src/app/(app)/layout.tsx (app shell layout)
    ├── src/app/(public)/layout.tsx (marketing layout)
    └── All page.tsx files that do NOT have "use client" at the top

CLIENT COMPONENTS (run in browser, marked with "use client")
    ├── All generator pages (use useState, useEffect, browser APIs)
    ├── src/components/generators/* (form inputs, output viewer)
    ├── src/components/layout/theme-toggle.tsx (next-themes)
    ├── src/components/layout/sidebar.tsx (Zustand store)
    ├── src/components/layout/mobile-sidebar.tsx
    ├── src/components/shared/copy-button.tsx (clipboard API)
    ├── src/stores/sidebar-store.ts (Zustand)
    └── src/hooks/use-copy-clipboard.ts

BROWSER-ONLY MODULES (must only be imported in client components)
    ├── src/client/** (IndexedDB, LocalStorage — all browser APIs)
    ├── src/features/**/service.ts (use @faker-js/faker, which is browser-safe)
    └── src/features/export/export.service.ts (triggerDownload uses DOM APIs)
```

---

## 8. Browser-Only API Safeguards

| API | Where Used | Safeguard |
|---|---|---|
| `IndexedDB` | `client/storage/indexed-db.service.ts` | Only imported in client components; `getDB()` is async and only called after mount |
| `localStorage` | `client/storage/local-storage.service.ts` | Every function checks `typeof window === "undefined"` and returns null/void for SSR |
| `document.createElement` | `features/export/export.service.ts` | `triggerDownload()` only called from click handlers in client components |
| `URL.createObjectURL` | `features/export/export.service.ts` | Same as above — click handler context only |
| `Blob` | `features/export/export.service.ts` | Same as above |
| `crypto.randomUUID` | `core/utils/random.ts` | Falls back to manual UUID generation if `crypto` is unavailable |
| `atob` | `features/export/export.service.ts` | Only used in triggerDownload for base64 decoding, click handler context |
| `navigator.clipboard` | `hooks/use-copy-clipboard.ts` | Client component only, guarded by async API availability |

---

## 9. Current Package Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.3.0 | Framework |
| `react` / `react-dom` | 19.2.8 | UI library |
| `@faker-js/faker` | ^10.5.0 | Test data generation |
| `zod` | ^3.23.0 | Input validation |
| `idb` | ^8.0.0 | IndexedDB wrapper |
| `lucide-react` | ^0.400.0 | Icons |
| `next-themes` | ^0.4.0 | Dark/light mode |
| `sonner` | ^1.7.0 | Toast notifications |
| `zustand` | ^5.0.0 | State management |
| `react-hook-form` | ^7.50.0 | Form handling |
| `@hookform/resolvers` | ^5.0.0 | Zod-to-form bridge |
| `recharts` | ^2.12.0 | Charts (dashboard) |
| `framer-motion` | ^11.0.0 | Animations |
| `class-variance-authority` | ^0.7.0 | Component variants |
| `clsx` | ^2.1.0 | Class name utility |
| `tailwind-merge` | ^2.3.0 | Tailwind class merging |
| `@radix-ui/react-*` | Various | Accessible UI primitives (accordion, dialog, dropdown, label, select, separator, slider, slot, switch, tabs, tooltip) |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5 | Type checking |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` / `@types/react-dom` | ^19 | React type definitions |
| `eslint` / `eslint-config-next` | ^9 / 16.3.0 | Linting |
| `tailwindcss` | ^4 | CSS utility framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |
| `vitest` | ^3.2.0 | Test runner (configured but no tests written) |

---

## 10. Current Production Build Result

```
Build command: npx next build
Build result: SUCCESS

TypeScript: 0 errors
Compiled: 7.6s
Page generation: 17/17 pages in ~4.6s

Route (app)
┌ ○ /                          (public landing page)
├ ○ /_not-found                (404 page)
├ ○ /about                     (marketing)
├ ○ /contact                   (marketing)
├ ○ /dashboard                 (app — analytics dashboard)
├ ○ /faq                       (marketing)
├ ○ /features                  (marketing)
├ ○ /generators/address        (app — address generator)
├ ○ /generators/banking        (app — banking generator)
├ ○ /generators/credit-card    (app — credit card generator)
├ ○ /generators/user-profile   (app — user profile generator)
├ ○ /privacy                   (marketing)
├ ○ /schema                    (app — schema intelligence)
├ ○ /settings                  (app — user settings)
└ ○ /terms                     (marketing)

○ = Static (prerendered as static content)
No dynamic or ISR routes.
No API routes.
```

---

## 11. Current Known Limitations

1. **No test suite:** Vitest is configured in package.json but no test files exist. All generators, formatters, repositories, and utilities are untested.
2. **No Payload Generator UI page:** The payload generator service exists (`features/payloads/`) but there is no corresponding page under `app/(app)/generators/`.
3. **No template management UI:** Template repository exists but no UI to save/load/manage templates.
4. **No history viewer UI:** History repository exists but no dedicated history browsing page.
5. **Faker locale not wired to UI:** Generator services accept locale config but generator pages do not expose locale selection.
6. **Seed not wired to UI:** All generators support deterministic seeding but no UI exposes the seed option.
7. **No data preview table:** Generated data is shown as raw JSON; no structured table view with column sorting/filtering.
8. **Edge case injection not exposed:** Payload generator supports edge case injection but no UI toggle exists.
9. **Large dataset performance:** No Web Worker offloading. Generating 1000 records with complex payload schemas may cause UI jank.
10. **No import/export of templates:** Templates exist only in local IndexedDB with no backup/restore mechanism.

---

## 12. Open Release Blockers

| ID | Blocker | Severity |
|---|---|---|
| **RB-001** | No automated tests exist for any module | High |
| **RB-002** | No Payload Generator page in the UI | Medium |
| **RB-003** | Template save/load UI not implemented | Medium |
| **RB-004** | History viewer UI not implemented | Low |
| **RB-005** | No `vercel.json` deployment configuration file | Low |

See `ARCHITECTURE_FINAL_STATUS.md` for detailed blocker tracking.

---

## 13. Files That Must Not Be Rebuilt

The following files are architecturally stable, type-checked, and production-build verified. They must not be rebuilt or structurally modified without cross-window coordination.

### Core Layer (shared by all features)
- `src/core/types/common.ts`
- `src/core/constants/limits.ts`
- `src/core/constants/defaults.ts`
- `src/core/utils/luhn.ts`
- `src/core/utils/iban.ts`
- `src/core/utils/random.ts`

### Generator Services (each is a self-contained, pure-function module)
- `src/features/users/user.{types,validation,service}.ts`
- `src/features/addresses/address.{types,validation,service}.ts`
- `src/features/banking/banking.{types,validation,service}.ts`
- `src/features/credit-cards/credit-card.{types,validation,service}.ts`
- `src/features/payloads/payload.{types,validation,service}.ts`

### Export Engine
- `src/features/export/export.{types,service}.ts`
- `src/features/export/formatters/*.ts`

### Client Storage
- `src/client/storage/indexed-db.service.ts`
- `src/client/storage/local-storage.service.ts`
- `src/client/models/*.ts`
- `src/client/repositories/*.ts`

---

## 14. Safe Extension Points

These are areas where new work can be added without modifying stable modules:

| Extension | How to Add | Does NOT Require Changes To |
|---|---|---|
| **New generator** (e.g., Company) | Create `src/features/companies/company.{types,validation,service}.ts` + page under `app/(app)/generators/company/page.tsx` | Existing generators, core layer |
| **New export format** (e.g., YAML) | Create `src/features/export/formatters/yaml.formatter.ts` implementing `IFormatter`, register in `export.service.ts` formatters map | Existing formatters |
| **New UI page** | Add page under `app/(app)/` or `app/(public)/` | Existing pages |
| **Template management UI** | Create page consuming `template.repository.ts` | Repository layer |
| **History viewer UI** | Create page consuming `history.repository.ts` | Repository layer |
| **Payload generator page** | Create `app/(app)/generators/payloads/page.tsx` consuming `payload.service.ts` | Payload service |
| **Dashboard analytics** | Create dashboard widgets consuming `analytics.repository.ts` | Analytics repository |
| **Tests** | Add `*.test.ts` files alongside source files, run with `vitest` | Source modules |

---

## 15. Handoff Instructions for QA Automation

### Test Coverage Needed

1. **Unit tests for each generator service:**
   - Call `generate{Users,Addresses,Banking,CreditCards,Payloads}()` with various configs
   - Verify record count matches requested count
   - Verify field presence/absence matches fields config
   - Verify Luhn validity of generated credit card numbers
   - Verify ABA routing number checksum
   - Verify IBAN check digits (mod-97)
   - Verify seed produces deterministic output

2. **Unit tests for each formatter:**
   - Round-trip: generate data → export → parse output → verify data integrity
   - Test CSV with special characters (commas, quotes, newlines in values)
   - Test SQL escaping (single quotes in values)
   - Test XML with nested objects and arrays
   - Test edge cases: empty data array, single record, 1000 records

3. **Unit tests for repositories:**
   - Requires `fake-indexeddb` package for Node.js testing
   - Test CRUD operations on templates, history, analytics
   - Test history auto-pruning at MAX_HISTORY_ENTRIES

4. **Integration tests (browser):**
   - Playwright or Cypress to test full generate → view → export flow
   - Test that IndexedDB persists across page reloads
   - Test that LocalStorage settings persist

### Test Runner

Vitest is configured in `package.json` (`scripts_test` section — note: must be merged into `scripts` to be usable). Run with `npx vitest run`.

---

## 16. Handoff Instructions for Deployment

### Vercel Deployment (Recommended)

1. Push repository to GitHub
2. Connect repository to Vercel dashboard
3. Vercel auto-detects Next.js — no special configuration needed
4. Build command: `next build` (auto-detected)
5. Output directory: `.next` (auto-detected)
6. No environment variables required
7. No database provisioning required
8. No external service configuration required

### Manual Deployment

```bash
npm install
npm run build
npm run start    # Starts production server on port 3000
```

### Pre-Deployment Checklist

- [ ] `npm run build` succeeds with 0 errors
- [ ] `npm run lint` passes (or warnings-only)
- [ ] All generator services produce valid output (manual or automated test)
- [ ] Export download works in target browsers (Chrome, Firefox, Safari, Edge)
- [ ] IndexedDB persistence verified in target browsers
- [ ] Verify no secrets or credentials in committed files

### What Vercel Hosts

Vercel serves the Next.js application. All pages are prerendered as static content at build time. The browser handles all computation (data generation, export, storage). No serverless functions, no edge functions, no database connections, no API routes.
