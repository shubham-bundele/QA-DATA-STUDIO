# Files Changed — CR-01: Seed-Based Reproducibility

## Production Code (12 files)

### Core Layer
| File | Type |
|------|------|
| `src/core/utils/random.ts` | Modified — added SeededRandom class, createRng factory, optional rng params |
| `src/core/utils/iban.ts` | Modified — internal functions accept optional SeededRandom, generateIBAN accepts rng |

### Generator Services
| File | Type |
|------|------|
| `src/features/users/user.service.ts` | Modified — per-operation Faker + SeededRandom, threaded through generatePassword |
| `src/features/addresses/address.service.ts` | Modified — per-operation Faker + SeededRandom |
| `src/features/banking/banking.service.ts` | Modified — per-operation Faker + SeededRandom, threaded through routing/SWIFT/IBAN |
| `src/features/credit-cards/credit-card.service.ts` | Modified — per-operation Faker + SeededRandom, threaded through card number/CVV/expiry |
| `src/features/payloads/payload.service.ts` | Modified — per-operation Faker + SeededRandom, threaded through recursive field generation |

### Schema Intelligence
| File | Type |
|------|------|
| `src/core/engines/orchestrator.ts` | Modified — per-process Faker + SeededRandom, threaded through all value generation functions |

### UI Layer
| File | Type |
|------|------|
| `src/components/generators/seed-control.tsx` | Created — reusable seed input component |
| `src/app/(app)/generators/user-profile/page.tsx` | Modified — added SeedControl, seed state |
| `src/app/(app)/generators/address/page.tsx` | Modified — added SeedControl, seed state |
| `src/app/(app)/generators/credit-card/page.tsx` | Modified — added SeedControl, seed state |
| `src/app/(app)/generators/banking/page.tsx` | Modified — added SeedControl, seed state |
| `src/app/(app)/schema/page.tsx` | Modified — added SeedControl, seed state |

## Test Code (1 file)

| File | Type |
|------|------|
| `tests/seed-reproducibility.test.ts` | Created — 28 tests for deterministic seed reproducibility |

## Documentation (7 files)

| File | Type |
|------|------|
| `RANDOMNESS_AUDIT_FINAL.md` | Created |
| `RANDOM_SOURCE_ARCHITECTURE.md` | Created |
| `SEED_IMPLEMENTATION_REPORT.md` | Created |
| `SEED_UI_IMPLEMENTATION.md` | Created |
| `SEED_REPRODUCIBILITY_TEST_EVIDENCE.md` | Created |
| `CR_01_COMPLETION_REPORT.md` | Created |
| `FILES_CHANGED_CR_01.md` | Created (this file) |
