import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AnalysisResult } from '@/core/engines/user-story-analyzer';

interface QAHistoryDB extends DBSchema {
  stories: {
    key: string; // Will use timestamp or UUID as ID
    value: {
      id: string;
      createdAt: number;
      result: AnalysisResult;
    };
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<QAHistoryDB>>;

export function initDB() {
  if (typeof window === 'undefined') return;
  if (!dbPromise) {
    dbPromise = openDB<QAHistoryDB>('qa-studio-history', 1, {
      upgrade(db) {
        const store = db.createObjectStore('stories', {
          keyPath: 'id',
        });
        store.createIndex('by-date', 'createdAt');
      },
    });
  }
}

export async function saveStoryResult(result: AnalysisResult) {
  initDB();
  const db = await dbPromise;
  const id = crypto.randomUUID();
  await db.put('stories', {
    id,
    createdAt: Date.now(),
    result
  });
  return id;
}

export async function getStoryHistory() {
  initDB();
  const db = await dbPromise;
  const all = await db.getAllFromIndex('stories', 'by-date');
  return all.reverse(); // Newest first
}

export async function clearStoryHistory() {
  initDB();
  const db = await dbPromise;
  await db.clear('stories');
}
