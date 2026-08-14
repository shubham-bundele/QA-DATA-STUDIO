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

interface FieldEntry {
  id: string
  name: string
  type: string
}

const FIELD_TYPE_OPTIONS = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "uuid", label: "UUID" },
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone" },
] as const

const DELIMITER_OPTIONS = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
] as const

const PRESETS = [
  {
    label: "User",
    fields: [
      { name: "name", type: "name" },
      { name: "email", type: "email" },
      { name: "phone", type: "phone" },
      { name: "active", type: "boolean" },
    ],
  },
  {
    label: "Product",
    fields: [
      { name: "id", type: "uuid" },
      { name: "name", type: "string" },
      { name: "price", type: "number" },
      { name: "inStock", type: "boolean" },
    ],
  },
  {
    label: "Employee",
    fields: [
      { name: "employee_id", type: "uuid" },
      { name: "full_name", type: "name" },
      { name: "email", type: "email" },
      { name: "hire_date", type: "date" },
    ],
  },
]

let fieldIdCounter = 0
function nextFieldId(): string {
  fieldIdCounter += 1
  return `csv-field-${fieldIdCounter}`
}

const defaultFields: FieldEntry[] = [
  { id: nextFieldId(), name: "name", type: "name" },
  { id: nextFieldId(), name: "email", type: "email" },
  { id: nextFieldId(), name: "value", type: "number" },
]

export default function CsvGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>(defaultFields)
  const [count, setCount] = useState(10)
  const [delimiter, setDelimiter] = useState(",")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()

  const addField = () => setFields(prev => [...prev, { id: nextFieldId(), name: "", type: "string" }])
  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id))
  const updateFieldName = (id: string, name: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const updateFieldType = (id: string, type: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, type } : f))
  const applyPreset = (preset: (typeof PRESETS)[number]) => setFields(preset.fields.map(f => ({ id: nextFieldId(), ...f })))

  const handleGenerate = useCallback(() => {
    const validFields = fields.filter(f => f.name.trim() !== "")
    if (validFields.length === 0) { toast.error("Add at least one field with a name"); return }
    setIsGenerating(true)
    const start = performance.now()
    try {
      const schema: PayloadFieldDefinition[] = validFields.map(f => ({
        fieldName: f.name.trim(),
        fieldType: f.type as PayloadFieldType,
      }))
      const result = generatePayloads({ count, format: "json", rootElement: "data", schema, options: { includeNulls: false, includeEdgeCases: false } })
      setDuration(Math.round(performance.now() - start))
      setData(result.records)
      toast.success(`Generated ${result.records.length} CSV records`)
    } catch { toast.error("Failed to generate CSV data") }
    finally { setIsGenerating(false) }
  }, [count, fields])

  const handleClear = () => { setData(null); setDuration(undefined) }

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
        <h3 className="mb-3 text-sm font-medium">Delimiter</h3>
        <Select value={delimiter} onValueChange={setDelimiter}>
          <SelectTrigger aria-label="Delimiter"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DELIMITER_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="include-headers" className="cursor-pointer">Include Header Row</Label>
        <Switch id="include-headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} />
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
                <SelectTrigger className="w-[120px]" aria-label={`Type for ${field.name || "column"}`}><SelectValue /></SelectTrigger>
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
      title="CSV Dataset Generator"
      description="Generate custom CSV test data with configurable columns, delimiters, and types"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
