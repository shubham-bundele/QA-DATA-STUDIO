// mulberry32: fast 32-bit PRNG with full-period guarantee
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRandom {
  private rng: () => number;
  private _seed: number;
  private _idCounter = 0;

  constructor(seed: number) {
    this._seed = seed;
    this.rng = mulberry32(seed);
  }

  get seed(): number {
    return this._seed;
  }

  next(): number {
    return this.rng();
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number, decimals: number = 2): number {
    const value = this.next() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  boolean(): boolean {
    return this.next() > 0.5;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  pickMultiple<T>(array: T[], count: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.pick(array));
    }
    return result;
  }

  weightedPick<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  digit(): number {
    return Math.floor(this.next() * 10);
  }

  digits(count: number): string {
    let result = "";
    for (let i = 0; i < count; i++) {
      result += this.digit().toString();
    }
    return result;
  }

  upperLetter(): string {
    return String.fromCharCode(65 + Math.floor(this.next() * 26));
  }

  upperLetters(count: number): string {
    let result = "";
    for (let i = 0; i < count; i++) {
      result += this.upperLetter();
    }
    return result;
  }

  char(chars: string): string {
    return chars[Math.floor(this.next() * chars.length)];
  }

  id(): string {
    this._idCounter++;
    const hex = this._idCounter.toString(16).padStart(8, "0");
    const s = this._seed.toString(16).padStart(8, "0").slice(0, 8);
    return `${hex}-${s.slice(0, 4)}-4000-8000-${s}0000`;
  }

  child(namespace: number): SeededRandom {
    return new SeededRandom(this._seed ^ (namespace * 2654435761));
  }
}

export function randomInt(min: number, max: number, rng?: SeededRandom): number {
  if (rng) return rng.int(min, max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals: number = 2, rng?: SeededRandom): number {
  if (rng) return rng.float(min, max, decimals);
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

export function randomPick<T>(array: T[], rng?: SeededRandom): T {
  if (rng) return rng.pick(array);
  return array[Math.floor(Math.random() * array.length)];
}

export function randomPickMultiple<T>(array: T[], count: number, rng?: SeededRandom): T[] {
  if (rng) return rng.pickMultiple(array, count);
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(randomPick(array));
  }
  return result;
}

export function weightedPick<T>(items: T[], weights: number[], rng?: SeededRandom): T {
  if (rng) return rng.weightedPick(items, weights);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function shuffleArray<T>(array: T[], rng?: SeededRandom): T[] {
  if (rng) return rng.shuffle(array);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateId(rng?: SeededRandom): string {
  if (rng) return rng.id();
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createRng(seed?: number): SeededRandom | undefined {
  return seed !== undefined ? new SeededRandom(seed) : undefined;
}
