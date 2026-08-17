"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { GeneratorLayout } from "@/components/generators/generator-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generatePayloads } from "@/features/payloads/payload.service"
import type { PayloadFieldDefinition } from "@/features/payloads/payload.types"
import type { PayloadFieldType } from "@/core/types/common"
import { exportData } from "@/features/export/export.service"

interface FieldEntry { id: string; name: string; type: string }

const FIELD_TYPE_OPTIONS = [
  { value: "string", label: "VARCHAR" },
  { value: "integer", label: "INTEGER" },
  { value: "number", label: "DECIMAL" },
  { value: "boolean", label: "BOOLEAN" },
  { value: "date", label: "DATE" },
  { value: "datetime", label: "TIMESTAMP" },
  { value: "email", label: "EMAIL (VARCHAR)" },
  { value: "uuid", label: "UUID" },
  { value: "name", label: "NAME (VARCHAR)" },
] as const

const PRESETS = [
  {
    label: "Users Table",
    tableName: "users",
    fields: [
      { name: "id", type: "integer" },
      { name: "username", type: "name" },
      { name: "email", type: "email" },
      { name: "created_at", type: "datetime" },
      { name: "active", type: "boolean" },
    ],
  },
  {
    label: "Products Table",
    tableName: "products",
    fields: [
      { name: "product_id", type: "uuid" },
      { name: "name", type: "string" },
      { name: "price", type: "number" },
      { name: "quantity", type: "integer" },
      { name: "updated_at", type: "date" },
    ],
  },
  {
    label: "Orders Table",
    tableName: "orders",
    fields: [
      { name: "order_id", type: "uuid" },
      { name: "customer", type: "name" },
      { name: "total", type: "number" },
      { name: "status", type: "string" },
      { name: "order_date", type: "datetime" },
    ],
  },
]

let fieldIdCounter = 0
function nextFieldId() { return `sql-field-${++fieldIdCounter}` }

export default function SqlGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: nextFieldId(), name: "id", type: "integer" },
    { id: nextFieldId(), name: "name", type: "string" },
    { id: nextFieldId(), name: "email", type: "email" },
  ])
  const [count, setCount] = useState(10)
  const [tableName, setTableName] = useState("test_data")
  const [dialect, setDialect] = useState<"mysql" | "postgres" | "sqlite">("postgres")
  const [includeCreate, setIncludeCreate] = useState(true)
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [sqlPreview, setSqlPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()

  const addField = () => setFields(prev => [...prev, { id: nextFieldId(), name: "", type: "string" }])
  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id))
  const updateFieldName = (id: string, name: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const updateFieldType = (id: string, type: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, type } : f))
  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setFields(preset.fields.map(f => ({ id: nextFieldId(), ...f })))
    setTableName(preset.tableName)
  }

  const handleGenerate = useCallback(() => {
    const validFields = fields.filter(f => f.name.trim() !== "")
    if (validFields.length === 0) { toast.error("Add at least one column with a name"); return }
    setIsGenerating(true)
    const start = performance.now()
    try {
      const schema: PayloadFieldDefinition[] = validFields.map(f => ({ fieldName: f.name.trim(), fieldType: f.type as PayloadFieldType }))
      const result = generatePayloads({ count, format: "json", rootElement: "data", schema, options: { includeNulls: false, includeEdgeCases: false } })
      setDuration(Math.round(performance.now() - start))
      setData(result.records)
      const sqlResult = exportData({ data: result.records, format: "sql", options: { tableName, dialect, includeCreate, prettyPrint: true } })
      setSqlPreview(sqlResult.output)
      toast.success(`Generated ${result.records.length} SQL INSERT statements`)
    } catch { toast.error("Failed to generate SQL data") }
    finally { setIsGenerating(false) }
  }, [count, fields, tableName, dialect, includeCreate])

  const handleClear = () => { setData(null); setDuration(undefined); setSqlPreview(null) }

  const configPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Record Count</h3>
        <div className="flex items-center gap-4">
          <Slider aria-label="Record count" value={[count]} onValueChange={([v]) => setCount(v)} min={1} max={100} step={1} className="flex-1" />
          <Input id="record-count" aria-label="Record count" type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="w-20" min={1} max={100} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Table Name</h3>
        <Input value={tableName} onChange={e => setTableName(e.target.value || "test_data")} placeholder="test_data" aria-label="Table name" />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">SQL Dialect</h3>
        <Select value={dialect} onValueChange={v => setDialect(v as "mysql" | "postgres" | "sqlite")}>
          <SelectTrigger aria-label="SQL dialect"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="postgres">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="sqlite">SQLite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="include-create" className="cursor-pointer">Include CREATE TABLE</Label>
        <Switch id="include-create" checked={includeCreate} onCheckedChange={setIncludeCreate} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p)}>{p.label}</Button>)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Columns</h3>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="flex items-center gap-2">
              <Input placeholder="Column name" value={field.name} onChange={e => updateFieldName(field.id, e.target.value)} className="flex-1" />
              <Select value={field.type} onValueChange={v => updateFieldType(field.id, v)}>
                <SelectTrigger className="w-[130px]" aria-label={`Type for ${field.name || "column"}`}><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} disabled={fields.length <= 1} aria-label={`Remove ${field.name || "column"}`}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addField} className="mt-3 w-full">
          <Plus className="mr-2 h-4 w-4" />Add Column
        </Button>
      </div>
    </div>
  )

  return (
    <GeneratorLayout
      title="SQL Generator"
      description="Generate SQL INSERT statements with CREATE TABLE, dialect selection, and type inference"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
