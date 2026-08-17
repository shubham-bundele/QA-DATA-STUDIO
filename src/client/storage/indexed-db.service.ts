import { openDB, type IDBPDatabase } from "idb"
import type { Template } from "../models/template.model"
import type { HistoryEntry } from "../models/history-entry.model"
import type { AnalyticsCounter } from "../models/analytics.model"

interface QADataStudioSchema {
  templates: {
    key: string
    value: Template
    indexes: {
      "by-generator": string
      "by-name": string
      "by-created": string
    }
  }
  history: {
    key: string
    value: HistoryEntry
    indexes: {
      "by-generator": string
      "by-date": string
    }
  }
  analytics: {
    key: string
    value: AnalyticsCounter
  }
}

let dbInstance: IDBPDatabase<QADataStudioSchema> | null = null

export async function getDB(): Promise<IDBPDatabase<QADataStudioSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<QADataStudioSchema>("qa-data-studio", 1, {
    upgrade(db) {
      const templateStore = db.createObjectStore("templates", { keyPath: "id" })
      templateStore.createIndex("by-generator", "generatorType")
      templateStore.createIndex("by-name", "name")
      templateStore.createIndex("by-created", "createdAt")

      const historyStore = db.createObjectStore("history", { keyPath: "id" })
      historyStore.createIndex("by-generator", "generatorType")
      historyStore.createIndex("by-date", "generatedAt")

      db.createObjectStore("analytics", { keyPath: "id" })
    },
  })

  return dbInstance
}
