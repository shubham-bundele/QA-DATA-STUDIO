"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, FlaskConical } from "lucide-react"
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
import type { SemanticType } from "@/core/engines/types"

interface FieldEntry { id: string; name: string; type: string }

const SEMANTIC_TYPES = [
  { value: "string", label: "String" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float / Decimal" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "boolean", label: "Boolean" },
  { value: "url", label: "URL" },
  { value: "uuid", label: "UUID" },
  { value: "ip_address", label: "IP Address" },
  { value: "zipcode", label: "ZIP Code" },
  { value: "ssn", label: "SSN" },
  { value: "credit_card_number", label: "Credit Card Number" },
  { value: "credit_card_cvv", label: "CVV" },
  { value: "credit_card_expiry", label: "Card Expiry" },
  { value: "iban", label: "IBAN" },
  { value: "currency", label: "Currency Code" },
  { value: "age", label: "Age" },
  { value: "enum", label: "Enum" },
] as const

const PRESETS = [
  {
    label: "User Form",
    fields: [
      { name: "username", type: "string" },
      { name: "email", type: "email" },
      { name: "age", type: "age" },
      { name: "phone", type: "phone" },
    ],
  },
  {
    label: "Payment",
    fields: [
      { name: "cardNumber", type: "credit_card_number" },
      { name: "cvv", type: "credit_card_cvv" },
      { name: "expiry", type: "credit_card_expiry" },
      { name: "amount", type: "float" },
    ],
  },
  {
    label: "Address",
    fields: [
      { name: "street", type: "string" },
      { name: "city", type: "string" },
      { name: "zipCode", type: "zipcode" },
      { name: "country", type: "string" },
    ],
  },
]

let fieldIdCounter = 0
function nextFieldId() { return `bnd-field-${++fieldIdCounter}` }

export default function BoundaryGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: nextFieldId(), name: "username", type: "string" },
    { id: nextFieldId(), name: "email", type: "email" },
    { id: nextFieldId(), name: "age", type: "integer" },
  ])
  const [maxValues, setMaxValues] = useState(20)
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()

  const addField = () => setFields(prev => [...prev, { id: nextFieldId(), name: "", type: "string" }])
  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id))
  const updateFieldName = (id: string, name: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const updateFieldType = (id: string, type: string) => setFields(prev => prev.map(f => f.id === id ? { ...f, type } : f))
  const applyPreset = (preset: (typeof PRESETS)[number]) => setFields(preset.fields.map(f => ({ id: nextFieldId(), ...f })))

  const handleGenerate = useCallback(async () => {
    const validFields = fields.filter(f => f.name.trim() !== "")
    if (validFields.length === 0) { toast.error("Add at least one field"); return }
    setIsGenerating(true)
    const start = performance.now()
    try {
      const { BoundaryEngine } = await import("@/core/engines/boundary-engine")
      const engine = new BoundaryEngine()
      const allRecords: Record<string, unknown>[] = []

      for (const field of validFields) {
        const descriptor = { name: field.name.trim(), originalName: field.name.trim(), semanticType: field.type as SemanticType, dataType: field.type, confidence: 1, constraints: {} }
        const values = engine.generate(descriptor)
        const limited = values.slice(0, maxValues)
        for (const value of limited) {
          allRecords.push({
            field: field.name.trim(),
            type: field.type,
            value: value === undefined ? "(undefined)" : value === null ? "(null)" : String(value),
            rawType: value === null ? "null" : value === undefined ? "undefined" : typeof value,
          })
        }
      }

      setDuration(Math.round(performance.now() - start))
      setData(allRecords)
      toast.success(`Generated ${allRecords.length} boundary values for ${validFields.length} fields`)
    } catch { toast.error("Failed to generate boundary values") }
    finally { setIsGenerating(false) }
  }, [fields, maxValues])

  const handleClear = () => { setData(null); setDuration(undefined) }

  const configPanel = (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Generates edge-case values to test input validation: nulls, empty strings, min/max limits, Unicode, overflow, and format violations.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Max Values per Field</h3>
        <div className="flex items-center gap-4">
          <Slider aria-label="Max values per field" value={[maxValues]} onValueChange={([v]) => setMaxValues(v)} min={5} max={50} step={5} className="flex-1" />
          <Input id="max-values" aria-label="Max values per field" type="number" value={maxValues} onChange={e => setMaxValues(Math.max(5, Math.min(50, Number(e.target.value) || 20)))} className="w-20" min={5} max={50} />
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
                <SelectTrigger className="w-[140px]" aria-label={`Type for ${field.name || "field"}`}><SelectValue /></SelectTrigger>
                <SelectContent>{SEMANTIC_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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
      title="Boundary Data Generator"
      description="Generate edge-case and boundary values to test input validation and error handling"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
