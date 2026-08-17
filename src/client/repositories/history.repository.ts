import { getDB } from "../storage/indexed-db.service"
import { generateId } from "@/core/utils/random"
import { MAX_HISTORY_ENTRIES } from "@/core/constants/limits"
import type { HistoryEntry } from "../models/history-entry.model"
import type { GeneratorType } from "@/core/types/common"

export async function getAllHistory(limit?: number): Promise<HistoryEntry[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex("history", "by-date")
  const sorted = all.reverse()
  return limit ? sorted.slice(0, limit) : sorted
}

export async function getHistoryById(id: string): Promise<HistoryEntry | undefined> {
  const db = await getDB()
  return db.get("history", id)
}

export async function getHistoryByGenerator(type: GeneratorType): Promise<HistoryEntry[]> {
  const db = await getDB()
  const entries = await db.getAllFromIndex("history", "by-generator", type)
  return entries.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
}

export async function addHistoryEntry(entry: Omit<HistoryEntry, "id">): Promise<string> {
  const db = await getDB()
  const id = generateId()
  await db.add("history", { ...entry, id })
  await pruneHistory(MAX_HISTORY_ENTRIES)
  return id
}

export async function clearHistory(): Promise<void> {
  const db = await getDB()
  await db.clear("history")
}

async function pruneHistory(keepCount: number): Promise<void> {
  const db = await getDB()
  const count = (await db.getAllKeys("history")).length
  if (count <= keepCount) return

  const all = await db.getAllFromIndex("history", "by-date")
  const toDelete = all.slice(0, count - keepCount)

  const tx = db.transaction("history", "readwrite")
  for (const entry of toDelete) {
    tx.store.delete(entry.id)
  }
  await tx.done
}
