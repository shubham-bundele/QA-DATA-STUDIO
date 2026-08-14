"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { GeneratorLayout } from "@/components/generators/generator-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

interface FieldEntry { id: string; name: string; type: string }

const FIELD_TYPE_OPTIONS = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "uuid", label: "UUID" },
  { value: "name", label: "Name" },
  { value: "url", label: "URL" },
] as const

const PRESETS = [
  {
    label: "Catalog",
    fields: [
      { name: "id", type: "uuid" },
      { name: "title", type: "string" },
      { name: "price", type: "number" },
      { name: "published", type: "date" },
    ],
  },
  {
    label: "Config",
    fields: [
      { name: "key", type: "string" },
      { name: "value", type: "string" },
      { name: "enabled", type: "boolean" },
    ],
  },
]

let fieldIdCounter = 0
function nextFieldId() { return `xml-field-${++fieldIdCounter}` }

export default function XmlGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: nextFieldId(), name: "id", type: "uuid" },
    { id: nextFieldId(), name: "name", type: "string" },
    { id: nextFieldId(), name: "value", type: "number" },
  ])
  const [count, setCount] = useState(10)
  const [rootElement, setRootElement] = useState("data")
  const [recordElement, setRecordElement] = useState("record")
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
      const schema: PayloadFieldDefinition[] = validFields.map(f => ({ fieldName: f.name.trim(), fieldType: f.type as PayloadFieldType }))
      const result = generatePayloads({ count, format: "xml", rootElement, schema, options: { includeNulls: false, includeEdgeCases: false } })
      setDuration(Math.round(performance.now() - start))
      setData(result.records)
      toast.success(`Generated ${result.records.length} XML records`)
    } catch { toast.error("Failed to generate XML data") }
    finally { setIsGenerating(false) }
  }, [count, fields, rootElement])

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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <h3 className="mb-2 text-sm font-medium">Root Element</h3>
          <Input value={rootElement} onChange={e => setRootElement(e.target.value || "data")} placeholder="data" aria-label="Root element name" />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Record Element</h3>
          <Input value={recordElement} onChange={e => setRecordElement(e.target.value || "record")} placeholder="record" aria-label="Record element name" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p)}>{p.label}</Button>)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Elements</h3>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="flex items-center gap-2">
              <Input placeholder="Element name" value={field.name} onChange={e => updateFieldName(field.id, e.target.value)} className="flex-1" />
              <Select value={field.type} onValueChange={v => updateFieldType(field.id, v)}>
                <SelectTrigger className="w-[120px]" aria-label={`Type for ${field.name || "element"}`}><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} disabled={fields.length <= 1} aria-label={`Remove ${field.name || "element"}`}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addField} className="mt-3 w-full">
          <Plus className="mr-2 h-4 w-4" />Add Element
        </Button>
      </div>
    </div>
  )

  return (
    <GeneratorLayout
      title="XML Generator"
      description="Generate well-formed XML test data with configurable elements and types"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
