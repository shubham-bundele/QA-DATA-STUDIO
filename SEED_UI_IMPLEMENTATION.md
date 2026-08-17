# Seed UI Implementation — CR-01

## Status: IMPLEMENTED

The seed control is a reusable component (`SeedControl`) added to all 4 generator pages and the Schema Intelligence page.

## Component: `src/components/generators/seed-control.tsx`

### Features

- Optional numeric seed input (0–2147483647)
- "Generate random seed" button (Shuffle icon)
- "Reuse previous seed" button (Copy icon) — appears after first seeded generation
- "Clear seed" button (X icon) — appears when seed is set
- Validation message for invalid input
- Last-used seed display
- Accessible labels on all controls
- Seed is not mandatory — empty input means unseeded (random) generation

### Pages Updated

| Page | Route | Seed Passed To |
|------|-------|---------------|
| User Profile | `/generators/user-profile` | `config.options.seed` |
| Address | `/generators/address` | `config.options.seed` |
| Credit Card | `/generators/credit-card` | `config.options.seed` |
| Banking | `/generators/banking` | `config.options.seed` |
| Schema Intelligence | `/schema` | `config.seed` |

### Behavior

1. Leave seed empty → unseeded generation (different results each time)
2. Enter a seed → deterministic generation (same seed = same results)
3. Click Shuffle → generates a random seed value
4. Generate with a seed → "Last used seed" appears below input
5. Click Copy → re-enters the last used seed
6. Click X → clears the seed
