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
  { value: "url", label: "URL" },
  { value: "name", label: "Name" },
  { value: "id", label: "ID" },
] as const

type UIFieldType = (typeof FIELD_TYPE_OPTIONS)[number]["value"]

function mapFieldType(uiType: UIFieldType): PayloadFieldType {
  if (uiType === "id") return "uuid"
  return uiType as PayloadFieldType
}

let fieldIdCounter = 0
function nextFieldId(): string {
  fieldIdCounter += 1
  return `field-${fieldIdCounter}`
}

const PRESETS: { label: string; fields: { name: string; type: UIFieldType }[] }[] = [
  {
    label: "User",
    fields: [
      { name: "id", type: "id" },
      { name: "name", type: "name" },
      { name: "email", type: "email" },
      { name: "active", type: "boolean" },
      { name: "createdAt", type: "date" },
    ],
  },
  {
    label: "Product",
    fields: [
      { name: "id", type: "id" },
      { name: "name", type: "string" },
      { name: "price", type: "number" },
      { name: "inStock", type: "boolean" },
      { name: "url", type: "url" },
    ],
  },
  {
    label: "Order",
    fields: [
      { name: "orderId", type: "id" },
      { name: "customer", type: "name" },
      { name: "total", type: "number" },
      { name: "status", type: "string" },
      { name: "orderDate", type: "date" },
    ],
  },
]

const defaultFields: FieldEntry[] = [
  { id: nextFieldId(), name: "id", type: "id" },
  { id: nextFieldId(), name: "name", type: "string" },
  { id: nextFieldId(), name: "value", type: "number" },
]

export default function JsonGeneratorPage() {
  const [fields, setFields] = useState<FieldEntry[]>(defaultFields)
  const [count, setCount] = useState(10)
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: nextFieldId(), name: "", type: "string" },
    ])
  }

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  const updateFieldName = (id: string, name: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    )
  }

  const updateFieldType = (id: string, type: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type } : f))
    )
  }

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setFields(
      preset.fields.map((f) => ({
        id: nextFieldId(),
        name: f.name,
        type: f.type,
      }))
    )
  }

  const handleGenerate = useCallback(() => {
    const validFields = fields.filter((f) => f.name.trim() !== "")
    if (validFields.length === 0) {
      toast.error("Add at least one field with a name")
      return
    }

    setIsGenerating(true)
    const start = performance.now()
    try {
      const schema: PayloadFieldDefinition[] = validFields.map((f) => ({
        fieldName: f.name.trim(),
        fieldType: mapFieldType(f.type as UIFieldType),
      }))

      const result = generatePayloads({
        count,
        format: "json",
        rootElement: "data",
        schema,
        options: {
          includeNulls: false,
          includeEdgeCases: false,
        },
      })

      const end = performance.now()
      setDuration(Math.round(end - start))
      setData(result.records)
      toast.success(`Generated ${result.records.length} JSON records`)
    } catch {
      toast.error("Failed to generate JSON data")
    } finally {
      setIsGenerating(false)
    }
  }, [count, fields])

  const handleClear = () => {
    setData(null)
    setDuration(undefined)
  }

  const configPanel = (
    <div className="space-y-6">
      {/* Record Count */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Record Count</h3>
        <div className="flex items-center gap-4">
          <Slider
            aria-label="Record count"
            value={[count]}
            onValueChange={([v]) => setCount(v)}
            min={1}
            max={100}
            step={1}
            className="flex-1"
          />
          <Input
            id="record-count"
            aria-label="Record count"
            type="number"
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
            }
            className="w-20"
            min={1}
            max={100}
          />
        </div>
      </div>

      {/* Preset Templates */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Field Definitions */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Fields</h3>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                placeholder="Field name"
                value={field.name}
                onChange={(e) => updateFieldName(field.id, e.target.value)}
                className="flex-1"
              />
              <Select
                value={field.type}
                onValueChange={(value) => updateFieldType(field.id, value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeField(field.id)}
                disabled={fields.length <= 1}
                aria-label={`Remove ${field.name || "field"}`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addField}
          className="mt-3 w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>
    </div>
  )

  return (
    <GeneratorLayout
      title="JSON Sample Generator"
      description="Generate custom JSON test data with configurable fields and types"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
