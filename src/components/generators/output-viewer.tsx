"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface OutputViewerProps {
  data: Record<string, unknown>[] | null
  viewMode: "table" | "json"
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function OutputViewer({ data, viewMode }: OutputViewerProps) {
  if (!data || data.length === 0) {
    return null
  }

  if (viewMode === "json") {
    return (
      <motion.div
        className="rounded-lg border bg-muted/30 p-4 overflow-auto max-h-[600px] scroll-smooth"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
          {renderJsonWithSyntaxColors(data)}
        </pre>
      </motion.div>
    )
  }

  const headers = Object.keys(data[0])

  return (
    <div className="overflow-auto rounded-lg border max-h-[600px] scroll-smooth">
      <table className="w-full text-sm">
        <caption className="sr-only">Generated test data</caption>
        <thead className="sticky top-0 z-10">
          <tr className="border-b bg-muted/60 backdrop-blur-sm">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
              #
            </th>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={index}
              custom={index}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                "border-b transition-colors duration-200",
                "hover:bg-primary/5",
                index % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                {index + 1}
              </td>
              {headers.map((header) => (
                <td key={header} className="px-4 py-2.5 whitespace-nowrap">
                  {formatCellValue(row[header])}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-"
  }
  if (typeof value === "object") {
    return JSON.stringify(value)
  }
  return String(value)
}

function renderJsonWithSyntaxColors(data: unknown): React.ReactNode {
  const jsonString = JSON.stringify(data, null, 2)
  const parts: React.ReactNode[] = []
  let keyIndex = 0

  const lines = jsonString.split("\n")
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]

    // Match JSON key-value patterns
    const keyValueMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/)
    if (keyValueMatch) {
      const [, indent, key, colon, rest] = keyValueMatch
      parts.push(
        <span key={`line-${lineIdx}`}>
          {indent}
          <span className="text-violet-600 dark:text-violet-400">&quot;{key}&quot;</span>
          <span className="text-muted-foreground">{colon}</span>
          {colorizeValue(rest, keyIndex++)}
        </span>
      )
    } else {
      // Brackets, commas, etc.
      parts.push(
        <span key={`line-${lineIdx}`} className="text-muted-foreground">
          {line}
        </span>
      )
    }

    if (lineIdx < lines.length - 1) {
      parts.push("\n")
    }
  }

  return parts
}

function colorizeValue(valueStr: string, key: number): React.ReactNode {
  const trimmed = valueStr.trimEnd().replace(/,$/, "")
  const hasComma = valueStr.trimEnd().endsWith(",")

  // String value
  if (trimmed.startsWith('"')) {
    return (
      <span key={`val-${key}`}>
        <span className="text-emerald-600 dark:text-emerald-400">{trimmed}</span>
        {hasComma && <span className="text-muted-foreground">,</span>}
      </span>
    )
  }

  // Number value
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return (
      <span key={`val-${key}`}>
        <span className="text-amber-600 dark:text-amber-400">{trimmed}</span>
        {hasComma && <span className="text-muted-foreground">,</span>}
      </span>
    )
  }

  // Boolean / null
  if (["true", "false", "null"].includes(trimmed)) {
    return (
      <span key={`val-${key}`}>
        <span className="text-sky-600 dark:text-sky-400">{trimmed}</span>
        {hasComma && <span className="text-muted-foreground">,</span>}
      </span>
    )
  }

  // Fallback (objects, arrays, etc.)
  return (
    <span key={`val-${key}`} className="text-foreground">
      {valueStr}
    </span>
  )
}
