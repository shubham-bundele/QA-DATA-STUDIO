"use client"

import { useState, useCallback } from "react"
import { ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { GeneratorLayout } from "@/components/generators/generator-layout"
import { SeedControl } from "@/components/generators/seed-control"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { generateCreditCards } from "@/features/credit-cards/credit-card.service"
import type { CreditCardFields } from "@/features/credit-cards/credit-card.types"
import type { CreditCardNetwork } from "@/core/types/common"

const defaultFields: CreditCardFields = {
  cardNumber: true,
  cardHolder: true,
  expiryDate: true,
  cvv: true,
  network: true,
  issuer: false,
}

const fieldLabels: Record<keyof CreditCardFields, string> = {
  cardNumber: "Card Number",
  cardHolder: "Cardholder Name",
  expiryDate: "Expiry Date",
  cvv: "CVV",
  network: "Network",
  issuer: "Issuer",
}

const networkOptions: { value: CreditCardNetwork; label: string }[] = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "American Express" },
  { value: "discover", label: "Discover" },
  { value: "diners", label: "Diners Club" },
]

export default function CreditCardGeneratorPage() {
  const [fields, setFields] = useState<CreditCardFields>(defaultFields)
  const [count, setCount] = useState(10)
  const [networks, setNetworks] = useState<CreditCardNetwork[]>(["visa", "mastercard"])
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()
  const [seed, setSeed] = useState<number | undefined>()
  const [lastUsedSeed, setLastUsedSeed] = useState<number | undefined>()

  const toggleField = (field: keyof CreditCardFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const toggleNetwork = (network: CreditCardNetwork) => {
    setNetworks((prev) => {
      if (prev.includes(network)) {
        if (prev.length === 1) return prev
        return prev.filter((n) => n !== network)
      }
      return [...prev, network]
    })
  }

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    const start = performance.now()
    try {
      const result = generateCreditCards({
        count,
        networks,
        fields,
        options: {
          expiryRange: { minMonths: 1, maxMonths: 60 },
          expired: false,
          formatted: true,
          seed,
        },
      })
      const end = performance.now()
      setDuration(Math.round(end - start))
      setData(result.records as unknown as Record<string, unknown>[])
      if (seed !== undefined) setLastUsedSeed(seed)
      toast.success(`Generated ${result.records.length} credit cards`)
    } catch {
      toast.error("Failed to generate credit cards")
    } finally {
      setIsGenerating(false)
    }
  }, [count, networks, fields, seed])

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
        <h3 className="mb-3 text-sm font-medium">Card Networks</h3>
        <div className="space-y-3">
          {networkOptions.map((opt) => (
            <div key={opt.value} className="flex items-center justify-between">
              <Label htmlFor={`network-${opt.value}`} className="cursor-pointer">
                {opt.label}
              </Label>
              <Switch
                id={`network-${opt.value}`}
                checked={networks.includes(opt.value)}
                onCheckedChange={() => toggleNetwork(opt.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Fields</h3>
        <div className="space-y-3">
          {(Object.keys(fieldLabels) as (keyof CreditCardFields)[]).map((field) => (
            <div key={field} className="flex items-center justify-between">
              <Label htmlFor={`field-${field}`} className="cursor-pointer">
                {fieldLabels[field]}
              </Label>
              <Switch
                id={`field-${field}`}
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
    <div className="space-y-4">
      <div role="alert" className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/50">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-200">TEST DATA ONLY</p>
          <p className="mt-1 text-amber-700 dark:text-amber-300">
            These credit card numbers are generated for testing purposes only. They are not real and cannot be used for transactions.
          </p>
        </div>
      </div>
      <GeneratorLayout
        title="Credit Card Generator"
        description="Generate Luhn-valid test credit card numbers"
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
