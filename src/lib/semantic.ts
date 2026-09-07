/**
 * Math utilities for semantic embeddings
 */

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means perfectly similar.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface LabelEmbedding {
  label: string;
  embedding: number[];
}

/**
 * Finds the closest label to a given embedding.
 */
export function bestLabelMatch(
  embedding: number[], 
  labels: LabelEmbedding[]
): { label: string; score: number } | null {
  if (labels.length === 0) return null;
  
  let bestLabel = labels[0].label;
  let bestScore = -Infinity;
  
  for (const item of labels) {
    const score = cosineSimilarity(embedding, item.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestLabel = item.label;
    }
  }
  
  return { label: bestLabel, score: bestScore };
}

export interface EmbeddingItem {
  id: string;
  text: string;
  embedding: number[];
}

export interface DuplicatePair {
  id1: string;
  id2: string;
  text1: string;
  text2: string;
  score: number;
}

/**
 * Finds near-duplicate items in a set of embeddings using pairwise comparison O(n^2).
 * Returns pairs that exceed the similarity threshold.
 */
export function findDuplicatePairs(
  items: EmbeddingItem[], 
  threshold: number = 0.9
): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const score = cosineSimilarity(items[i].embedding, items[j].embedding);
      if (score >= threshold) {
        duplicates.push({
          id1: items[i].id,
          id2: items[j].id,
          text1: items[i].text,
          text2: items[j].text,
          score
        });
      }
    }
  }
  
  // Sort by highest score first
  return duplicates.sort((a, b) => b.score - a.score);
}
