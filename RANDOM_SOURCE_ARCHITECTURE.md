# Random Source Architecture — CR-01

## Design

A single `SeededRandom` class using the **mulberry32** PRNG algorithm replaces all `Math.random()` calls in the deterministic generation path.

### mulberry32

- 32-bit state, full-period (2^32 values before repeating)
- Fast: ~2ns per call (comparable to `Math.random()`)
- Deterministic: same seed always produces same sequence
- Widely used and validated in game engines and procedural generation

### SeededRandom API

```typescript
class SeededRandom {
  constructor(seed: number)
  get seed(): number
  next(): number          // [0, 1) float
  int(min, max): number   // inclusive range
  float(min, max, decimals?): number
  boolean(): boolean
  pick<T>(array): T
  pickMultiple<T>(array, count): T[]
  weightedPick<T>(items, weights): T
  shuffle<T>(array): T[]
  digit(): number         // 0-9
  digits(count): string
  upperLetter(): string   // A-Z
  upperLetters(count): string
  char(chars): string
  id(): string            // deterministic synthetic ID
  child(namespace): SeededRandom  // namespaced sub-stream
}
```

### Key Design Decisions

1. **Per-operation instances:** Each `generate*()` call creates its own `SeededRandom` from the provided seed. No global state.
2. **Per-operation Faker:** When seeded, a new `Faker` instance is created with the `SeededRandom` as its randomizer. The global `faker` singleton is never seeded.
3. **Optional parameter pattern:** All utility functions (`randomInt`, `randomPick`, etc.) accept an optional `rng?: SeededRandom` parameter. When absent, they fall back to `Math.random()`.
4. **Deterministic IDs:** When seeded, `generateId()` returns a counter-based synthetic ID instead of `crypto.randomUUID()`.
5. **Child streams:** `child(namespace)` creates a sub-PRNG from a hash of the parent seed and namespace, providing isolation without consuming parent state.

### Concurrency Safety

Each generation operation creates its own `SeededRandom` and `Faker` instance. There is no shared mutable state between operations. Two concurrent seeded generations cannot interfere with each other.

### Unseeded Mode

When no seed is provided, `createRng()` returns `undefined`. All utility functions check for `undefined` and fall back to `Math.random()`. The global `faker` singleton is used as before. This preserves the existing behavior for unseeded generation.
