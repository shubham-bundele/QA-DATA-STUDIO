# Seed Reproducibility Test Evidence — CR-01

## Test File: `tests/seed-reproducibility.test.ts`

## Results

```
npx vitest run tests/seed-reproducibility.test.ts

 ✓ tests/seed-reproducibility.test.ts (28 tests) 215ms

 Test Files  1 passed (1)
      Tests  28 passed (28)
```

## Test Coverage Matrix

| # | Test | Requirement | Status |
|---|------|------------|--------|
| 1 | SeededRandom: produces identical sequences from the same seed | PRNG determinism | PASS |
| 2 | SeededRandom: produces different sequences from different seeds | PRNG variation | PASS |
| 3 | SeededRandom: deterministic int, float, pick, shuffle | API determinism | PASS |
| 4 | SeededRandom: deterministic ID generation | ID reproducibility | PASS |
| 5 | SeededRandom: child streams are deterministic and isolated | Namespaced streams | PASS |
| 6 | User Generator: same seed produces identical records | Generator reproducibility | PASS |
| 7 | User Generator: different seed produces different records | Generator variation | PASS |
| 8 | User Generator: unseeded mode produces variable output | Unseeded randomness preserved | PASS |
| 9 | User Generator: same seed with custom email domains produces identical records | Domain selection determinism | PASS |
| 10 | Address Generator: same seed produces identical records | Generator reproducibility | PASS |
| 11 | Address Generator: different seed produces different records | Generator variation | PASS |
| 12 | Address Generator: same seed with state filter produces identical records | Filter selection determinism | PASS |
| 13 | Credit Card Generator: same seed produces identical records | Generator reproducibility | PASS |
| 14 | Credit Card Generator: different seed produces different records | Generator variation | PASS |
| 15 | Credit Card Generator: seeded cards remain Luhn-valid | Algorithmic integrity | PASS |
| 16 | Banking Generator: same seed produces identical records | Generator reproducibility | PASS |
| 17 | Banking Generator: different seed produces different records | Generator variation | PASS |
| 18 | Banking Generator: seeded ABA routing numbers remain checksum-valid | Algorithmic integrity | PASS |
| 19 | Banking Generator: seeded IBANs remain mod-97 valid | Algorithmic integrity | PASS |
| 20 | Payload Generator: same seed produces identical records | Generator reproducibility | PASS |
| 21 | Payload Generator: different seed produces different records | Generator variation | PASS |
| 22 | Payload Generator: same seed with recursive schema produces identical records | Recursive structure stability | PASS |
| 23 | Payload Generator: same seed with edge cases produces identical records | Edge case determinism | PASS |
| 24 | Schema Intelligence: same seed produces identical positive records | Orchestrator reproducibility | PASS |
| 25 | Schema Intelligence: same seed produces identical negative records | Negative path reproducibility | PASS |
| 26 | Schema Intelligence: different seed produces different output | Orchestrator variation | PASS |
| 27 | Concurrent operations: two seeded generators do not interfere | Isolation | PASS |
| 28 | Export does not mutate records | Data integrity | PASS |

## Full Suite Results

```
npx vitest run

 Test Files  22 passed (22)
      Tests  320 passed (320)
```

292 existing tests + 28 new seed tests = 320 total. Zero failures. Zero skipped.

## Quality Gates

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Vitest (full suite) | 320/320 pass |
| Production build (`next build`) | 17/17 pages |
| No `ts-ignore` | Confirmed |
| No skipped tests | Confirmed |
| No broad `any` types | Confirmed |
| No weakened assertions | Confirmed |
