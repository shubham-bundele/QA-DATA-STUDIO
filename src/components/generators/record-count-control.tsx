"use client"

import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface RecordCountControlProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function RecordCountControl({
  value,
  onChange,
  min = 1,
  max = 100,
}: RecordCountControlProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value)
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)))
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={1}
        className="flex-1"
      />
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        className="w-20"
        min={min}
        max={max}
      />
    </div>
  )
}
