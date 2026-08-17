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

interface FieldEntry { id: string; name: string; type: string }

const FIELD_TYPE_OPTIONS = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "uuid", label: "UUID" },
  { value: "ip", label: "IP Address" },
  { value: "name", label: "Name" },
  { value: "address", label: "Address" },
  { value: "paragraph", label: "Paragraph" },
] as const

const PRESETS = [
  {
    label: "REST User",
    fields: [
      { name: "id", type: "uuid" },
      { name: "username", type: "name" },
      { name: "email", type: "email" },
      { name: "avatar", type: "url" },
      { name: "active", type: "boolean" },
      { name: "createdAt", type: "datetime" },
    ],
  },
  {
    label: "GraphQL Product",
    fields: [
      { name: "sku", type: "uuid" },
      { name: "title", type: "string" },
      { name: "description", type: "paragraph" },
      { name: "price", type: "number" },
      { name: "inStock", type: "boolean" },
    ],
  },
  {
    label: "Webhook Event",
    fields: [
      { name: "eventId", type: "uuid" },
      { name: "type", type: "string" },
      { name: "timestamp", type: "datetime" },
      { name: "source", type: "url" },
      { name: "ip", type: "ip" },
    ],
  },
]

let fieldIdCounter = 0
function nextFieldId() { return `api-field-${++fieldIdCounter}` }

export default function ApiPayloadGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: nextFieldId(), name: "id", type: "uuid" },
    { id: nextFieldId(), name: "name", type: "name" },
    { id: nextFieldId(), name: "email", type: "email" },
    { id: nextFieldId(), name: "active", type: "boolean" },
  ])
  const [count, setCount] = useState(10)
  const [format, setFormat] = useState<"json" | "xml">("json")
  const [includeNulls, setIncludeNulls] = useState(false)
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false)
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
      const result = generatePayloads({ count, format, rootElement: "data", schema, options: { includeNulls, includeEdgeCases } })
      setDuration(Math.round(performance.now() - start))
      setData(result.records)
      toast.success(`Generated ${result.records.length} API payload records`)
    } catch { toast.error("Failed to generate API payloads") }
    finally { setIsGenerating(false) }
  }, [count, fields, format, includeNulls, includeEdgeCases])

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
        <h3 className="mb-3 text-sm font-medium">Output Format</h3>
        <Select value={format} onValueChange={v => setFormat(v as "json" | "xml")}>
          <SelectTrigger aria-label="Output format"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="xml">XML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-nulls" className="cursor-pointer">Include Null Values</Label>
          <Switch id="include-nulls" checked={includeNulls} onCheckedChange={setIncludeNulls} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="include-edge" className="cursor-pointer">Include Edge Cases</Label>
          <Switch id="include-edge" checked={includeEdgeCases} onCheckedChange={setIncludeEdgeCases} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p)}>{p.label}</Button>)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Fields</h3>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="flex items-center gap-2">
              <Input placeholder="Field name" value={field.name} onChange={e => updateFieldName(field.id, e.target.value)} className="flex-1" />
              <Select value={field.type} onValueChange={v => updateFieldType(field.id, v)}>
                <SelectTrigger className="w-[120px]" aria-label={`Type for ${field.name || "field"}`}><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} disabled={fields.length <= 1} aria-label={`Remove ${field.name || "field"}`}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addField} className="mt-3 w-full">
          <Plus className="mr-2 h-4 w-4" />Add Field
        </Button>
      </div>
    </div>
  )

  return (
    <GeneratorLayout
      title="API Payload Generator"
      description="Generate realistic API request and response payloads with 14+ data types"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
