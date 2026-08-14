"use client"

import { useState, useCallback } from "react"
import { User } from "lucide-react"
import { toast } from "sonner"
import { GeneratorLayout } from "@/components/generators/generator-layout"
import { SeedControl } from "@/components/generators/seed-control"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { generateUsers } from "@/features/users/user.service"
import type { UserFields } from "@/features/users/user.types"

const defaultFields: UserFields = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  age: false,
  gender: false,
  username: true,
  password: false,
  avatar: false,
  ssn: false,
}

const fieldLabels: Record<keyof UserFields, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email Address",
  phone: "Phone Number",
  dateOfBirth: "Date of Birth",
  age: "Age",
  gender: "Gender",
  username: "Username",
  password: "Password",
  avatar: "Avatar URL",
  ssn: "SSN (Synthetic)",
}

export default function UserProfileGeneratorPage() {
  const [fields, setFields] = useState<UserFields>(defaultFields)
  const [count, setCount] = useState(10)
  const [passwordLength, setPasswordLength] = useState(12)
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()
  const [seed, setSeed] = useState<number | undefined>()
  const [lastUsedSeed, setLastUsedSeed] = useState<number | undefined>()

  const toggleField = (field: keyof UserFields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    const start = performance.now()
    try {
      const result = generateUsers({
        count,
        locale: "en",
        fields,
        options: {
          ageRange: { min: 18, max: 65 },
          emailDomains: [],
          passwordLength,
          seed,
        },
      })
      const end = performance.now()
      setDuration(Math.round(end - start))
      setData(result.records as unknown as Record<string, unknown>[])
      if (seed !== undefined) setLastUsedSeed(seed)
      toast.success(`Generated ${result.records.length} user profiles`)
    } catch {
      toast.error("Failed to generate user profiles")
    } finally {
      setIsGenerating(false)
    }
  }, [count, fields, passwordLength, seed])

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
        <h3 className="mb-3 text-sm font-medium">Fields</h3>
        <div className="space-y-3">
          {(Object.keys(fieldLabels) as (keyof UserFields)[]).map((field) => (
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

      {fields.ssn && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          SSN values are randomly generated synthetic identifiers for testing only. They do not correspond to real individuals.
        </p>
      )}

      {fields.password && (
        <div>
          <h3 className="mb-3 text-sm font-medium">Password Length</h3>
          <div className="flex items-center gap-4">
            <Slider
              aria-label="Password length"
              value={[passwordLength]}
              onValueChange={([v]) => setPasswordLength(v)}
              min={8}
              max={32}
              step={1}
              className="flex-1"
            />
            <Input
              id="password-length"
              aria-label="Password length"
              type="number"
              value={passwordLength}
              onChange={(e) => setPasswordLength(Math.max(8, Math.min(32, Number(e.target.value) || 8)))}
              className="w-20"
              min={8}
              max={32}
            />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <GeneratorLayout
      title="User Profile Generator"
      description="Generate realistic user profiles with configurable fields"
      configPanel={configPanel}
      data={data}
      isGenerating={isGenerating}
      duration={duration}
      onGenerate={handleGenerate}
      onClear={handleClear}
    />
  )
}
