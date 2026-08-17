export type FieldType = 'toggle' | 'select' | 'number' | 'text' | 'multi-select'

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  defaultValue: unknown
  options?: { value: string; label: string }[]
  description?: string
}

export interface GeneratorMeta {
  id: string
  name: string
  description: string
  href: string
  category: 'personal' | 'financial'
  fields: FieldDefinition[]
  defaultConfig: Record<string, unknown>
}

export interface GeneratorResult {
  id: string
  generatorId: string
  generatorName: string
  config: Record<string, unknown>
  data: Record<string, unknown>[]
  recordCount: number
  generatedAt: number
  duration: number
}
