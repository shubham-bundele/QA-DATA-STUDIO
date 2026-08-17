import { getDB } from "../storage/indexed-db.service"
import { generateId } from "@/core/utils/random"
import type { Template } from "../models/template.model"
import type { GeneratorType } from "@/core/types/common"

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex("templates", "by-created")
  return all.reverse()
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  const db = await getDB()
  return db.get("templates", id)
}

export async function getTemplatesByType(type: GeneratorType): Promise<Template[]> {
  const db = await getDB()
  return db.getAllFromIndex("templates", "by-generator", type)
}

export async function createTemplate(
  template: Omit<Template, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = await getDB()
  const id = generateId()
  const now = new Date().toISOString()

  await db.add("templates", {
    ...template,
    id,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<Template, "id" | "createdAt">>
): Promise<void> {
  const db = await getDB()
  const existing = await db.get("templates", id)
  if (!existing) return

  await db.put("templates", {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("templates", id)
}

export async function searchTemplates(query: string): Promise<Template[]> {
  const db = await getDB()
  const lowerQuery = query.toLowerCase()
  const all = await db.getAll("templates")
  return all.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
  )
}
