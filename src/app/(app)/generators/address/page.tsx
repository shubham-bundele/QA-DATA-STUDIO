"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { GeneratorLayout } from "@/components/generators/generator-layout"
import { SeedControl } from "@/components/generators/seed-control"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generateAddresses } from "@/features/addresses/address.service"
import type { AddressFields } from "@/features/addresses/address.types"

const defaultFields: AddressFields = {
  street: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  county: false,
  latitude: false,
  longitude: false,
  fullAddress: false,
}

const fieldLabels: Record<keyof AddressFields, string> = {
  street: "Street Address",
  city: "City",
  state: "State / Province",
  zipCode: "ZIP / Postal Code",
  country: "Country",
  county: "County",
  latitude: "Latitude",
  longitude: "Longitude",
  fullAddress: "Full Address",
}

const countries = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
]

export default function AddressGeneratorPage() {
  const [fields, setFields] = useState<AddressFields>(defaultFields)
  const [count, setCount] = useState(10)
  const [country, setCountry] = useState("US")
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()
  const [seed, setSeed] = useState<number | undefined>()
  const [lastUsedSeed, setLastUsedSeed] = useState<number | undefined>()

  const toggleField = (field: keyof AddressFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    const start = performance.now()
    try {
      const result = generateAddresses({
        count,
        country,
        fields,
        options: { stateFilter: [], seed },
      })
      const end = performance.now()
      setDuration(Math.round(end - start))
      setData(result.records as unknown as Record<string, unknown>[])
      if (seed !== undefined) setLastUsedSeed(seed)
      toast.success(`Generated ${result.records.length} addresses`)
    } catch {
      toast.error("Failed to generate addresses")
    } finally {
      setIsGenerating(false)
    }
  }, [count, country, fields, seed])

  const handleClear = () => {
    setData(null)
    setDuration(undefined)
  }

  const configPanel = (
    <div className="space-y-6">
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
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-20"
            min={1}
            max={100}
          />
        </div>
      </div>

      <SeedControl seed={seed} onSeedChange={setSeed} lastUsedSeed={lastUsedSeed} />

      <div>
        <h3 className="mb-3 text-sm font-medium">Country</h3>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger aria-label="Country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Fields</h3>
        <div className="space-y-3">
          {(Object.keys(fieldLabels) as (keyof AddressFields)[]).map((field) => (
            <div key={field} className="flex items-center justify-between">
              <Label htmlFor={field} className="cursor-pointer">
                {fieldLabels[field]}
              </Label>
              <Switch
                id={field}
                checked={fields[field]}
                onCheckedChange={() => toggleField(field)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <GeneratorLayout
      title="Address Generator"
      description="Generate realistic addresses for any country"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
