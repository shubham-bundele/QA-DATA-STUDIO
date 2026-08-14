"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Shuffle, Copy, X } from "lucide-react"

interface SeedControlProps {
  seed: number | undefined
  onSeedChange: (seed: number | undefined) => void
  lastUsedSeed?: number
}

export function SeedControl({ seed, onSeedChange, lastUsedSeed }: SeedControlProps) {
  const [inputValue, setInputValue] = useState(seed?.toString() ?? "")

  function handleInputChange(value: string) {
    setInputValue(value)
    if (value === "") {
      onSeedChange(undefined)
      return
    }
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= 2147483647) {
      onSeedChange(num)
    }
  }

  function handleRandomSeed() {
    const s = Math.floor(Math.random() * 2147483647)
    setInputValue(s.toString())
    onSeedChange(s)
  }

  function handleReuseSeed() {
    if (lastUsedSeed !== undefined) {
      setInputValue(lastUsedSeed.toString())
      onSeedChange(lastUsedSeed)
    }
  }

  function handleClear() {
    setInputValue("")
    onSeedChange(undefined)
  }

  const isValid = inputValue === "" || (!isNaN(parseInt(inputValue, 10)) && parseInt(inputValue, 10) >= 0)

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Seed (Optional)</h3>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="seed-input" className="sr-only">Seed value</Label>
          <Input
            id="seed-input"
            aria-label="Seed value for reproducible generation"
            type="text"
            inputMode="numeric"
            placeholder="Leave empty for random"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={!isValid ? "border-red-500" : ""}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRandomSeed}
          title="Generate random seed"
          aria-label="Generate random seed"
        >
          <Shuffle className="h-4 w-4" />
        </Button>
        {lastUsedSeed !== undefined && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleReuseSeed}
            title={`Reuse seed ${lastUsedSeed}`}
            aria-label={`Reuse previous seed ${lastUsedSeed}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {seed !== undefined && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            title="Clear seed"
            aria-label="Clear seed"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!isValid && (
        <p className="mt-1 text-xs text-red-500">Seed must be a non-negative integer (0–2147483647)</p>
      )}
      {lastUsedSeed !== undefined && seed === undefined && (
        <p className="mt-1 text-xs text-muted-foreground">Last used seed: {lastUsedSeed}</p>
      )}
    </div>
  )
}
