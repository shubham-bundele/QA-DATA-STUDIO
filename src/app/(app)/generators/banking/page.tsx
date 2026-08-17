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
import { generateBanking } from "@/features/banking/banking.service"
import type { BankingFields } from "@/features/banking/banking.types"
import type { AccountType } from "@/core/types/common"

const defaultFields: BankingFields = {
  bankName: true,
  accountNumber: true,
  routingNumber: true,
  swiftCode: false,
  iban: false,
  accountType: true,
  balance: true,
  currency: true,
}

const fieldLabels: Record<keyof BankingFields, string> = {
  bankName: "Bank Name",
  accountNumber: "Account Number",
  routingNumber: "Routing Number",
  swiftCode: "SWIFT / BIC Code",
  iban: "IBAN",
  accountType: "Account Type",
  balance: "Balance",
  currency: "Currency",
}

const countryOptions = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IN", label: "India" },
]

export default function BankingGeneratorPage() {
  const [fields, setFields] = useState<BankingFields>(defaultFields)
  const [count, setCount] = useState(10)
  const [country, setCountry] = useState("US")
  const [currency, setCurrency] = useState("USD")
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()
  const [seed, setSeed] = useState<number | undefined>()
  const [lastUsedSeed, setLastUsedSeed] = useState<number | undefined>()

  const toggleField = (field: keyof BankingFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    const start = performance.now()
    try {
      const adjustedFields = {
        ...fields,
        iban: (country === "US" || country === "IN") ? false : fields.iban,
        routingNumber: country !== "US" ? false : fields.routingNumber,
      }
      const result = generateBanking({
        count,
        fields: adjustedFields,
        options: {
          accountTypes: ["checking", "savings", "business"] as AccountType[],
          balanceRange: { min: 100, max: 100000 },
          currency,
          country,
          seed,
        },
      })
      const end = performance.now()
      setDuration(Math.round(end - start))
      setData(result.records as unknown as Record<string, unknown>[])
      if (seed !== undefined) setLastUsedSeed(seed)
      toast.success(`Generated ${result.records.length} banking records`)
    } catch {
      toast.error("Failed to generate banking data")
    } finally {
      setIsGenerating(false)
    }
  }, [count, fields, country, currency, seed])

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
            {countryOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Currency</h3>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger aria-label="Currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="EUR">EUR (&euro;)</SelectItem>
            <SelectItem value="GBP">GBP (&pound;)</SelectItem>
            <SelectItem value="INR">INR (&#8377;)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Fields</h3>
        <div className="space-y-3">
          {(Object.keys(fieldLabels) as (keyof BankingFields)[]).map((field) => {
            const ibanDisabled = field === "iban" && (country === "US" || country === "IN")
            const routingDisabled = field === "routingNumber" && country !== "US"
            const isDisabled = ibanDisabled || routingDisabled

            return (
              <div key={field}>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`field-${field}`} className={isDisabled ? "text-muted-foreground/50" : "cursor-pointer"}>
                    {fieldLabels[field]}
                    {ibanDisabled && <span className="ml-1 text-[10px]">(not used in {country})</span>}
                    {routingDisabled && <span className="ml-1 text-[10px]">(US only)</span>}
                  </Label>
                  <Switch
                    id={`field-${field}`}
                    checked={isDisabled ? false : fields[field]}
                    onCheckedChange={() => !isDisabled && toggleField(field)}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <GeneratorLayout
      title="Banking Generator"
      description="Generate banking data with valid routing numbers, IBAN, and SWIFT codes"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
