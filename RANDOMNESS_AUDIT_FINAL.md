# Randomness Audit — CR-01: Seed-Based Reproducibility

**Date:** 2026-08-13
**Auditor:** Window 3 (Backend Architecture)
**Scope:** All files under `src/` in `qa-data-studio/`

---

## Summary

**30+ direct `Math.random()` call sites** exist across 7 source files. These bypass faker's seeded PRNG entirely, making seed-based reproducibility impossible in the current architecture. Additionally, `crypto.randomUUID()` is used for record IDs and `new Date()` affects 2 generated values (age calculation, expiry date calculation).

---

## Audit Results

### 1. `src/core/utils/random.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 2 | `randomInt()` | `Math.random()` | YES | Accept `RandomSource`, delegate to `rng.next()` | Medium — used by all generators | YES |
| 6 | `randomFloat()` | `Math.random()` | YES | Accept `RandomSource`, delegate to `rng.next()` | Medium | YES |
| 11 | `randomPick()` | `Math.random()` | YES | Accept `RandomSource`, delegate to `rng.next()` | Medium | YES |
| 24 | `weightedPick()` | `Math.random()` | YES | Accept `RandomSource`, delegate to `rng.next()` | Low | YES |
| 37 | `shuffleArray()` | `Math.random()` | YES | Accept `RandomSource`, delegate to `rng.next()` | Low | YES |
| 44-45 | `generateId()` | `crypto.randomUUID()` | YES | Deterministic counter-based ID when seeded | High — IDs appear in output | YES |
| 48 | `generateId()` fallback | `Math.random()` | YES | Same as above | High | YES |

### 2. `src/core/utils/iban.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 22 | `randomDigits()` | `Math.random()` | YES | Accept `RandomSource` | Medium — IBAN validity must be preserved | YES |
| 30 | `randomUpperLetters()` | `Math.random()` | YES | Accept `RandomSource` | Medium | YES |
| 39 | `generateBBAN()` | `Math.random()` | YES | Accept `RandomSource` | Medium — mod-97 check depends on digits | YES |
| 41 | `generateBBAN()` | `Math.random()` | YES | Same as above | Medium | YES |

### 3. `src/features/users/user.service.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 17-20 | `generatePassword()` | `Math.random()` (×4) | YES | Accept `RandomSource` | Low | YES |
| 25 | `generatePassword()` | `Math.random()` | YES | Same | Low | YES |
| 30 | `generatePassword()` shuffle | `Math.random()` | YES | Same | Low | YES |
| 60 | `generateUsers()` | `Math.random()` | YES | Use `RandomSource` from config | Medium | YES |
| 88 | `generateUsers()` | `new Date()` for age calc | NO — age is derived from faker-generated DOB relative to today | N/A | Low | NO |

### 4. `src/features/addresses/address.service.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 41 | `generateAddresses()` | `Math.random()` | YES | Use `RandomSource` from config | Low | YES |

### 5. `src/features/banking/banking.service.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 31 | `generateRoutingNumber()` | `Math.random()` (×8 in loop) | YES | Accept `RandomSource` | High — ABA checksum must remain valid | YES |
| 49 | `generateSwiftCode()` | `Math.random()` (×4) | YES | Accept `RandomSource` | Medium | YES |
| 55-57 | `generateSwiftCode()` | `Math.random()` (×4) | YES | Same | Medium | YES |

### 6. `src/features/credit-cards/credit-card.service.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 54 | `generateCardNumber()` | `Math.random()` | YES | Accept `RandomSource` | High — Luhn validity must be preserved | YES |
| 73 | `generateExpiry()` | `new Date()` | PARTIAL — date-relative but offset is random | Use `RandomSource` for offset selection | Medium | YES |
| 95 | `generateCVV()` | `Math.random()` | YES | Accept `RandomSource` | Low | YES |

### 7. `src/core/engines/orchestrator.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 60 | `generateCreditCardNumber()` | `Math.random()` | YES | Accept `RandomSource` | High — Luhn validity | YES |
| 221 | `generatePositiveValue()` boolean | `Math.random()` | YES | Use `RandomSource` | Low | YES |
| 617 | `generateNegativeRecords()` | `Math.random()` | YES | Use `RandomSource` | Medium | YES |

### 8. `src/features/payloads/payload.service.ts`

| Line | Function | Random Source | Determinism Required | Replacement | Risk | Regression Test |
|------|----------|-------------|---------------------|-------------|------|-----------------|
| 20 | `generateFieldValue()` nullable | `Math.random()` | YES | Use `RandomSource` | Low | YES |
| 38 | `generateFieldValue()` boolean | `Math.random()` | YES | Use `RandomSource` | Low | YES |
| 173 | `generatePayloads()` edge case | `Math.random()` | YES | Use `RandomSource` | Low | YES |

### 9. Faker Global Seed (all generators + orchestrator)

| File | Lines | Issue | Replacement |
|------|-------|-------|-------------|
| `user.service.ts` | 39, 124 | `faker.seed()` / `faker.seed()` reset — seeds global faker, unsafe for concurrent ops | Create per-operation `Faker` instance |
| `address.service.ts` | 24, 69 | Same | Same |
| `banking.service.ts` | 67, 95 | Same | Same |
| `credit-card.service.ts` | 104, 150 | Same | Same |
| `payload.service.ts` | 161, 187 | Same | Same |
| `orchestrator.ts` | 491, 546 | Same | Same |

### 10. Non-Deterministic `new Date()` in Metadata (No Change Required)

These occurrences are metadata-only and do not affect generated record values:

| File | Line | Usage |
|------|------|-------|
| `user.service.ts` | 131 | `generatedAt` in meta |
| `address.service.ts` | 76 | `generatedAt` in meta |
| `banking.service.ts` | 102 | `generatedAt` in meta |
| `credit-card.service.ts` | 157 | `generatedAt` in meta |
| `payload.service.ts` | 195 | `generatedAt` in meta |
| `export.service.ts` | 17 | filename generation |
| `sql.formatter.ts` | 22 | SQL comment |
| `template.repository.ts` | 27, 50 | template timestamps |
| `analytics.repository.ts` | 19, 65 | date keys |
| `footer.tsx` | 95 | copyright year |

---

## Root Cause

The architecture seeds `faker` (which controls faker's internal PRNG) but makes ~30 direct `Math.random()` calls that bypass faker entirely. Seeding faker alone has no effect on these calls, making reproducibility impossible.

## Fix Strategy

1. Implement a `SeededRandom` class using the mulberry32 PRNG algorithm
2. Make all random utility functions accept an optional `SeededRandom` parameter, defaulting to `Math.random()` when unseeded
3. Create per-operation `Faker` instances instead of seeding the global singleton
4. Thread the `SeededRandom` instance through all generation paths
5. Replace `generateId()` with deterministic sequential IDs when seeded
6. Preserve Luhn, IBAN mod-97, and ABA routing checksum validity
