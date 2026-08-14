"use client"

import { useState, useCallback } from "react"
import { Plus, Trash2, Shield, AlertTriangle } from "lucide-react"
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
  { value: "username", label: "Username" },
  { value: "password", label: "Password" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "phone", label: "Phone" },
  { value: "ip_address", label: "IP Address" },
  { value: "first_name", label: "First Name" },
  { value: "city", label: "City" },
  { value: "ssn", label: "SSN" },
] as const

const PRESETS = [
  {
    label: "Login Form",
    fields: [
      { name: "username", type: "username" },
      { name: "password", type: "password" },
    ],
  },
  {
    label: "Search Input",
    fields: [
      { name: "query", type: "string" },
      { name: "category", type: "string" },
    ],
  },
  {
    label: "User Profile",
    fields: [
      { name: "name", type: "first_name" },
      { name: "email", type: "email" },
      { name: "website", type: "url" },
      { name: "bio", type: "string" },
    ],
  },
]

let fieldIdCounter = 0
function nextFieldId() { return `sec-field-${++fieldIdCounter}` }

export default function SecurityGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: nextFieldId(), name: "username", type: "username" },
    { id: nextFieldId(), name: "password", type: "password" },
  ])
  const [maxPayloads, setMaxPayloads] = useState(20)
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
      const { SecurityEngine } = await import("@/core/engines/security-engine")
      const engine = new SecurityEngine()
      const allRecords: Record<string, unknown>[] = []

      for (const field of validFields) {
        const descriptor = { name: field.name.trim(), originalName: field.name.trim(), semanticType: field.type as SemanticType, dataType: field.type, confidence: 1, constraints: {} }
        const payloads = engine.generate(descriptor)
        const limited = payloads.slice(0, maxPayloads)
        for (const payload of limited) {
          allRecords.push({
            field: field.name.trim(),
            type: field.type,
            payload: String(payload),
            length: String(payload).length,
          })
        }
      }

      setDuration(Math.round(performance.now() - start))
      setData(allRecords)
      toast.success(`Generated ${allRecords.length} security payloads for ${validFields.length} fields`)
    } catch { toast.error("Failed to generate security payloads") }
    finally { setIsGenerating(false) }
  }, [fields, maxPayloads])

  const handleClear = () => { setData(null); setDuration(undefined) }

  const configPanel = (
    <div className="space-y-6">
      <div role="alert" className="flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        <div>
          <p className="font-semibold text-foreground">Authorized Testing Only</p>
          <p className="mt-1 text-foreground/80">
            These payloads are for testing systems you own or have explicit permission to test. QA Data Studio does not execute or transmit payloads.
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Max Payloads per Field</h3>
        <div className="flex items-center gap-4">
          <Slider aria-label="Max payloads per field" value={[maxPayloads]} onValueChange={([v]) => setMaxPayloads(v)} min={5} max={50} step={5} className="flex-1" />
          <Input id="max-payloads" aria-label="Max payloads per field" type="number" value={maxPayloads} onChange={e => setMaxPayloads(Math.max(5, Math.min(50, Number(e.target.value) || 20)))} className="w-20" min={5} max={50} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => <Button key={p.label} variant="outline" size="sm" onClick={() => applyPreset(p)}>{p.label}</Button>)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Target Fields</h3>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="flex items-center gap-2">
              <Input placeholder="Field name" value={field.name} onChange={e => updateFieldName(field.id, e.target.value)} className="flex-1" />
              <Select value={field.type} onValueChange={v => updateFieldType(field.id, v)}>
                <SelectTrigger className="w-[130px]" aria-label={`Type for ${field.name || "field"}`}><SelectValue /></SelectTrigger>
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
    <div className="space-y-4">
      <GeneratorLayout
        title="Security Payload Generator"
        description="Generate SQL injection, XSS, command injection, and other security test payloads"
        configPanel={configPanel}
        data={data}
        isGenerating={isGenerating}
        duration={duration}
        onGenerate={handleGenerate}
        onClear={handleClear}
      />
    </div>
  )
}
