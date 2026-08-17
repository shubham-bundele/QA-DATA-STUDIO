import { getDB } from "../storage/indexed-db.service"
import { createEmptyAnalytics } from "../models/analytics.model"
import type { AnalyticsCounter } from "../models/analytics.model"
import type { GeneratorType, ExportFormat } from "@/core/types/common"

const TOTAL_KEY = "total"

async function getOrCreateCounter(id: string): Promise<AnalyticsCounter> {
  const db = await getDB()
  const existing = await db.get("analytics", id)
  if (existing) return existing

  const counter = createEmptyAnalytics(id)
  await db.add("analytics", counter)
  return counter
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}

export async function recordGeneration(
  generatorType: GeneratorType,
  recordCount: number
): Promise<void> {
  const db = await getDB()
  const keys = [TOTAL_KEY, todayKey()]

  for (const key of keys) {
    const counter = await getOrCreateCounter(key)
    counter.totalGenerations += 1
    counter.totalRecords += recordCount

    if (generatorType in counter.byGenerator) {
      counter.byGenerator[generatorType as keyof typeof counter.byGenerator] += 1
    }

    await db.put("analytics", counter)
  }
}

export async function recordExport(format: ExportFormat): Promise<void> {
  const db = await getDB()
  const keys = [TOTAL_KEY, todayKey()]

  for (const key of keys) {
    const counter = await getOrCreateCounter(key)
    counter.totalExports += 1

    if (format in counter.byExportFormat) {
      counter.byExportFormat[format] += 1
    }

    await db.put("analytics", counter)
  }
}

export async function getTotals(): Promise<AnalyticsCounter> {
  return getOrCreateCounter(TOTAL_KEY)
}

export async function getDailyStats(days: number): Promise<AnalyticsCounter[]> {
  const db = await getDB()
  const results: AnalyticsCounter[] = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split("T")[0]
    const counter = await db.get("analytics", key)
    if (counter) {
      results.push(counter)
    }
  }

  return results
}

export async function resetAnalytics(): Promise<void> {
  const db = await getDB()
  await db.clear("analytics")
}
