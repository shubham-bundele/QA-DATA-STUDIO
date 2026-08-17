/**
 * String utility functions for field name analysis.
 * Used by the pattern matcher and field classifier to normalize,
 * tokenize, and compare field names.
 */

/**
 * Normalize a field name: lowercase, replace non-alphanumeric chars
 * with underscores, and trim leading/trailing underscores.
 */
export function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Tokenize a field name by splitting on camelCase, snake_case,
 * kebab-case, and PascalCase boundaries into lowercase word tokens.
 */
export function tokenize(name: string): string[] {
  // Insert separator before uppercase letters that follow lowercase letters (camelCase)
  let separated = name.replace(/([a-z])([A-Z])/g, "$1_$2");
  // Insert separator before uppercase letters followed by lowercase (PascalCase sequences)
  separated = separated.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2");
  // Split on non-alphanumeric characters
  const tokens = separated
    .split(/[^a-zA-Z0-9]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 0);

  return tokens;
}

/**
 * Calculate the Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity between two strings as a value from 0 to 1,
 * based on Levenshtein distance.
 */
export function similarity(a: string, b: string): number {
  const normalA = normalize(a);
  const normalB = normalize(b);

  if (normalA === normalB) return 1;
  if (normalA.length === 0 && normalB.length === 0) return 1;

  const maxLen = Math.max(normalA.length, normalB.length);
  if (maxLen === 0) return 1;

  const dist = levenshtein(normalA, normalB);
  return 1 - dist / maxLen;
}
