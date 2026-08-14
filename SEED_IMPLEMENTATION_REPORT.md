# Seed Implementation Report — CR-01

## Summary

Seed-based reproducibility is now fully implemented across all 5 generators, the Schema Intelligence orchestrator, and the UI. The same seed, generator, configuration, and application version produce identical generated records.

## Changes Made

### Core Layer

| File | Change |
|------|--------|
| `src/core/utils/random.ts` | Added `SeededRandom` class (mulberry32 PRNG), `createRng()` factory. All utility functions now accept optional `rng?: SeededRandom` parameter. |
| `src/core/utils/iban.ts` | All internal random functions accept optional `SeededRandom`. `generateIBAN()` now accepts `rng?` parameter. |

### Generator Services

| File | Change |
|------|--------|
| `src/features/users/user.service.ts` | Creates per-operation `Faker` + `SeededRandom` when seeded. Threads rng through `generatePassword()`, email domain selection, and `generateId()`. |
| `src/features/addresses/address.service.ts` | Creates per-operation `Faker` + `SeededRandom`. Threads rng through state filter selection and `generateId()`. |
| `src/features/banking/banking.service.ts` | Creates per-operation `Faker` + `SeededRandom`. Threads rng through `generateRoutingNumber()`, `generateSwiftCode()`, `generateIBAN()`, `randomPick()`, `randomFloat()`. |
| `src/features/credit-cards/credit-card.service.ts` | Creates per-operation `Faker` + `SeededRandom`. Threads rng through `generateCardNumber()`, `generateExpiry()`, `generateCVV()`, network selection, issuer selection. |
| `src/features/payloads/payload.service.ts` | Creates per-operation `Faker` + `SeededRandom`. Threads rng through `generateFieldValue()` (all 17 types), `applyEdgeCases()`, recursive nested generation. |

### Schema Intelligence

| File | Change |
|------|--------|
| `src/core/engines/orchestrator.ts` | Creates per-process `Faker` + `SeededRandom`. Threads through `generatePositiveValue()`, `generateNegativeValue()`, `generateCreditCardNumber()`, all category generation methods, and validation retry. |

### UI Layer

| File | Change |
|------|--------|
| `src/components/generators/seed-control.tsx` | New reusable seed input component with random seed generation, reuse previous seed, clear seed, validation. |
| `src/app/(app)/generators/user-profile/page.tsx` | Added SeedControl, seed state, passes seed to generator options. |
| `src/app/(app)/generators/address/page.tsx` | Added SeedControl, seed state, passes seed to generator options. |
| `src/app/(app)/generators/credit-card/page.tsx` | Added SeedControl, seed state, passes seed to generator options. |
| `src/app/(app)/generators/banking/page.tsx` | Added SeedControl, seed state, passes seed to generator options. |
| `src/app/(app)/schema/page.tsx` | Added SeedControl, seed state, passes seed to orchestrator config. |

### Tests

| File | Tests Added |
|------|------------|
| `tests/seed-reproducibility.test.ts` | 28 new tests covering all generators, orchestrator, concurrent isolation, export immutability |

## Algorithmic Integrity Preserved

| Algorithm | Status | Evidence |
|-----------|--------|----------|
| Luhn check digit | Preserved | Test "seeded cards remain Luhn-valid" passes |
| IBAN mod-97 | Preserved | Test "seeded IBANs remain mod-97 valid" passes |
| ABA routing checksum | Preserved | Test "seeded ABA routing numbers remain checksum-valid" passes |
| SWIFT/BIC format | Preserved | Structure remains 4 alpha + 2 alpha + 2 alphanum |

## Seed Metadata

When a seed is provided, it is captured in the generation result's `meta.seed` field. The `generatedAt` timestamp in meta is informational only and does not affect generated record values.
