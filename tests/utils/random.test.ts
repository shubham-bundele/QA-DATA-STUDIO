import { describe, it, expect } from "vitest";
import {
  randomInt,
  randomFloat,
  randomPick,
  randomPickMultiple,
  weightedPick,
  shuffleArray,
  generateId,
} from "@/core/utils/random";

describe("randomInt", () => {
  it("returns integer in range [min, max] over 100 iterations", () => {
    for (let i = 0; i < 100; i++) {
      const value = randomInt(1, 10);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("returns the value when min and max are the same", () => {
    expect(randomInt(5, 5)).toBe(5);
  });
});

describe("randomFloat", () => {
  it("returns float in range [min, max]", () => {
    for (let i = 0; i < 100; i++) {
      const value = randomFloat(1.0, 10.0);
      expect(value).toBeGreaterThanOrEqual(1.0);
      expect(value).toBeLessThanOrEqual(10.0);
    }
  });

  it("respects decimal precision", () => {
    for (let i = 0; i < 50; i++) {
      const value = randomFloat(0, 100, 3);
      const decimalPart = value.toString().split(".")[1];
      if (decimalPart) {
        expect(decimalPart.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it("defaults to 2 decimal places", () => {
    for (let i = 0; i < 50; i++) {
      const value = randomFloat(0, 100);
      const decimalPart = value.toString().split(".")[1];
      if (decimalPart) {
        expect(decimalPart.length).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("randomPick", () => {
  it("returns an element from the array", () => {
    const items = ["a", "b", "c", "d"];
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(randomPick(items));
    }
  });

  it("returns the only element from a single-element array", () => {
    expect(randomPick([42])).toBe(42);
  });
});

describe("randomPickMultiple", () => {
  it("returns the correct count of elements", () => {
    const items = [1, 2, 3, 4, 5];
    const result = randomPickMultiple(items, 3);
    expect(result).toHaveLength(3);
  });

  it("only returns elements from the source array", () => {
    const items = ["x", "y", "z"];
    const result = randomPickMultiple(items, 10);
    for (const item of result) {
      expect(items).toContain(item);
    }
  });
});

describe("weightedPick", () => {
  it("returns an element from items", () => {
    const items = ["a", "b", "c"];
    const weights = [1, 2, 3];
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(weightedPick(items, weights));
    }
  });

  it("returns the single item when only one is provided", () => {
    expect(weightedPick(["only"], [1])).toBe("only");
  });
});

describe("shuffleArray", () => {
  it("returns array of same length with same elements", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual([...original].sort());
  });

  it("does not mutate the original array", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffleArray(original);
    expect(original).toEqual(copy);
  });
});

describe("generateId", () => {
  it("returns a string matching UUID v4 format", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("produces unique IDs across multiple calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});
