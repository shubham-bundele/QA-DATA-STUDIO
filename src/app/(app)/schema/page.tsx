"use client"

import { useState, useCallback } from "react"
import { Play, FileSearch, Download, Copy, Check, Sparkles, AlertTriangle, Shield, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { SeedControl } from "@/components/generators/seed-control"
import { EmptyState } from "@/components/shared/empty-state"
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard"
import type { InputFormat, DataCategory } from "@/core/engines/types"

interface AnalysisField {
  name: string
  semanticType: string
  dataType: string
  confidence: number
  constraints: Record<string, unknown>
}

interface AnalysisRelationship {
  from: string
  to: string
  type: string
}

interface CategoryResult {
  category: DataCategory
  records: Record<string, unknown>[]
  metadata: { fieldCount: number; recordCount: number; description: string }
}

const SAMPLE_SCHEMAS: Record<string, { format: InputFormat; content: string }> = {
  "User Profile": {
    format: "json-schema",
    content: JSON.stringify({
      type: "object",
      required: ["firstName", "lastName", "email", "age"],
      properties: {
        id: { type: "integer" },
        firstName: { type: "string", minLength: 1, maxLength: 50 },
        lastName: { type: "string", minLength: 1, maxLength: 50 },
        email: { type: "string", format: "email", maxLength: 254 },
        phone: { type: "string" },
        dateOfBirth: { type: "string", format: "date" },
        age: { type: "integer", minimum: 0, maximum: 150 },
        gender: { type: "string", enum: ["Male", "Female", "Non-binary"] },
        streetAddress: { type: "string" },
        city: { type: "string" },
        state: { type: "string", maxLength: 2 },
        zipCode: { type: "string" },
        company: { type: "string" },
      },
    }, null, 2),
  },
  "SQL Table": {
    format: "sql",
    content: `CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    ssn VARCHAR(11),
    department VARCHAR(100),
    salary DECIMAL(10, 2),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);`,
  },
  "Raw JSON": {
    format: "json",
    content: JSON.stringify([{
      user_id: 1, name: "John Smith", email: "john@gmail.com",
      phone: "+1-555-0123", dob: "1990-05-15", city: "New York",
      state: "NY", zip: "10001", company: "Acme Corp",
      salary: 95000.0, is_active: true,
    }], null, 2),
  },
  "CSV": {
    format: "csv",
    content: `first_name,last_name,email,phone,date_of_birth,city,state,zip_code,company
John,Smith,john@example.com,555-0123,1990-05-15,New York,NY,10001,Acme Corp
Jane,Doe,jane@example.com,555-0456,1985-11-22,Los Angeles,CA,90001,Globex`,
  },
}

const FORMAT_LABELS: Record<InputFormat, string> = {
  "json-schema": "JSON Schema",
  json: "Raw JSON",
  csv: "CSV",
  sql: "SQL",
}

const CATEGORY_CONFIG: Record<DataCategory, { label: string; icon: typeof Sparkles; color: string }> = {
  positive: { label: "Positive", icon: Sparkles, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  negative: { label: "Negative", icon: AlertTriangle, color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  boundary: { label: "Boundary", icon: Target, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  security: { label: "Security", icon: Shield, color: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
}

export default function SchemaPage() {
  const [schemaInput, setSchemaInput] = useState(`{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "format": "uuid" },
    "username": { "type": "string", "minLength": 3, "maxLength": 20 },
    "age": { "type": "integer", "minimum": 18, "maximum": 99 },
    "is_active": { "type": "boolean" }
  },
  "required": ["user_id", "username", "age"]
}`)
  const [inputFormat, setInputFormat] = useState<InputFormat>("json-schema")
  const [categories, setCategories] = useState<DataCategory[]>(["positive", "negative", "boundary", "security"])
  const [recordCount, setRecordCount] = useState(10)
  const [analysis, setAnalysis] = useState<{ fields: AnalysisField[]; relationships: AnalysisRelationship[] } | null>(null)
  const [results, setResults] = useState<CategoryResult[] | null>(null)
  const [activeCategory, setActiveCategory] = useState<DataCategory>("positive")
  const [status, setStatus] = useState("")
  const [analysisError, setAnalysisError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [duration, setDuration] = useState<number | undefined>()
  const [seed, setSeed] = useState<number | undefined>()
  const [lastUsedSeed, setLastUsedSeed] = useState<number | undefined>()
  const { copy, copied } = useCopyToClipboard()

  const loadSample = useCallback((key: string) => {
    const sample = SAMPLE_SCHEMAS[key]
    if (sample) {
      setSchemaInput(sample.content)
      setInputFormat(sample.format)
      setAnalysis(null)
      setResults(null)
      setStatus("")
    }
  }, [])

  const toggleCategory = useCallback((cat: DataCategory) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }, [])

  async function handleAnalyze() {
    if (!schemaInput.trim()) return
    setIsProcessing(true)
    setAnalysisError("")
    const start = performance.now()

    try {
      const { SchemaDetector } = await import("@/core/engines/schema-detection")
      const { FieldClassifier } = await import("@/core/engines/field-classification")
      const { RelationshipEngine } = await import("@/core/engines/relationship-engine")

      const detector = new SchemaDetector()
      const classifier = new FieldClassifier()
      const relEngine = new RelationshipEngine()

      const schema = detector.detect(inputFormat, schemaInput)

      if (schema.fields.length === 0) {
        setAnalysis(null)
        setResults(null)
        setAnalysisError("Unable to analyze this schema. Check that the input is valid JSON, JSON Schema, CSV, or a supported SQL CREATE TABLE statement.")
        setStatus("")
        return
      }

      const classified = classifier.classifyAll(schema.fields)
      const relationships = relEngine.detect(classified)

      setAnalysis({
        fields: classified.map(f => ({
          name: f.name,
          semanticType: f.semanticType,
          dataType: f.dataType,
          confidence: f.confidence,
          constraints: f.constraints as Record<string, unknown>,
        })),
        relationships: relationships.map(r => ({ from: r.from, to: r.to, type: r.type })),
      })
      setDuration(Math.round(performance.now() - start))
      setStatus(`Analyzed ${classified.length} fields`)
    } catch (error) {
      setAnalysis(null)
      setResults(null)
      setAnalysisError(`Unable to analyze this schema. ${error instanceof Error ? error.message : "Check that the input format is correct."}`)
      setStatus("")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleGenerate() {
    if (!schemaInput.trim() || categories.length === 0) return
    setIsProcessing(true)
    setAnalysisError("")
    const start = performance.now()

    try {
      const { Orchestrator } = await import("@/core/engines/orchestrator")
      const orchestrator = new Orchestrator()
      const generated = orchestrator.process(inputFormat, schemaInput, {
        categories,
        recordsPerCategory: recordCount,
        seed,
      })

      setResults(generated)
      setActiveCategory(categories[0])
      setDuration(Math.round(performance.now() - start))
      if (seed !== undefined) setLastUsedSeed(seed)
      const total = generated.reduce((s, r) => s + r.records.length, 0)
      setStatus(`Generated ${total} records across ${generated.length} categories`)
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleExportJson() {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "qa-test-data.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const confidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return "default" as const
    if (confidence >= 0.5) return "secondary" as const
    return "destructive" as const
  }

  const confidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return "High"
    if (confidence >= 0.5) return "Medium"
    if (confidence >= 0.3) return "Low"
    return "Unknown"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schema Intelligence"
        description="Paste any schema — auto-detect fields and generate positive, negative, boundary, and security test data"
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left Panel - Schema Input */}
        <div className="w-full shrink-0 xl:w-[480px]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Schema Input</CardTitle>
                <div className="flex gap-1">
                  {(Object.keys(SAMPLE_SCHEMAS) as string[]).map(key => (
                    <Button key={key} variant="ghost" size="sm" className="h-7 text-xs" onClick={() => loadSample(key)}>
                      {key}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format selector */}
              <div className="flex gap-1.5">
                {(Object.entries(FORMAT_LABELS) as [InputFormat, string][]).map(([fmt, label]) => (
                  <Button
                    key={fmt}
                    variant={inputFormat === fmt ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setInputFormat(fmt)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Format limitations hint */}
              <p className="text-xs text-muted-foreground">
                {inputFormat === "json-schema" && "Supports top-level properties with type, format, enum, min/max, pattern. No $ref resolution, nested objects, or allOf/anyOf/oneOf."}
                {inputFormat === "json" && "Infers types from sample values. Supports string, number, boolean, date. No constraint extraction from values."}
                {inputFormat === "sql" && "Supports single CREATE TABLE with column types, NOT NULL, PRIMARY KEY, UNIQUE, DEFAULT, REFERENCES. No ALTER TABLE or multi-table input."}
                {inputFormat === "csv" && "Comma-delimited only. First row as headers. Infers types from up to 20 data rows. No tab or semicolon delimiters."}
              </p>

              {/* Schema textarea */}
              <textarea
                value={schemaInput}
                onChange={e => setSchemaInput(e.target.value)}
                placeholder={`Paste your ${FORMAT_LABELS[inputFormat]} here...`}
                rows={14}
                aria-label={`${FORMAT_LABELS[inputFormat]} input`}
                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />

              {/* Category toggles */}
              <div>
                <label className="mb-2 block text-sm font-medium">Data Categories</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(CATEGORY_CONFIG) as [DataCategory, typeof CATEGORY_CONFIG.positive][]).map(([cat, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          categories.includes(cat) ? cfg.color : "bg-muted text-muted-foreground opacity-50"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Record count */}
              <div className="flex items-center gap-3">
                <label htmlFor="schema-record-count" className="text-sm font-medium">Records per category</label>
                <input
                  id="schema-record-count"
                  type="number"
                  value={recordCount}
                  onChange={e => setRecordCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={100}
                  className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>

              {/* Seed control */}
              <SeedControl seed={seed} onSeedChange={setSeed} lastUsedSeed={lastUsedSeed} />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleAnalyze} disabled={isProcessing || !schemaInput.trim()} className="flex-1">
                  <FileSearch className="mr-2 h-4 w-4" />
                  Analyze
                </Button>
                <Button onClick={handleGenerate} disabled={isProcessing || !schemaInput.trim() || categories.length === 0} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>

              {analysisError && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{analysisError}</span>
                </div>
              )}

              {status && !analysisError && (
                <p className="text-sm text-muted-foreground">
                  {status}
                  {duration !== undefined && <span className="ml-2 text-xs">({duration}ms)</span>}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="min-w-0 flex-1">
          {!analysis && !results ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={FileSearch}
                  title="Paste a schema to begin"
                  description="Supports JSON Schema (flat properties), raw JSON (type inference), SQL CREATE TABLE (single table), and CSV (comma-delimited). Click Analyze to detect fields or Generate to create test data."
                />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={results ? "data" : "analysis"}>
              <TabsList>
                <TabsTrigger value="analysis" disabled={!analysis}>Schema Analysis</TabsTrigger>
                <TabsTrigger value="data" disabled={!results}>Generated Data</TabsTrigger>
              </TabsList>

              {/* Analysis Tab */}
              <TabsContent value="analysis">
                {analysis && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">Detected Fields</CardTitle>
                        <Badge variant="secondary">{analysis.fields.length} fields</Badge>
                        {analysis.relationships.length > 0 && (
                          <Badge variant="outline">{analysis.relationships.length} relationships</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Field</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Semantic Type</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Data Type</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Confidence</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Constraints</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.fields.map(field => (
                              <tr key={field.name} className="border-b last:border-0">
                                <td className="px-3 py-2 font-mono text-sm">{field.name}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="default" className="text-xs">{field.semanticType}</Badge>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{field.dataType}</td>
                                <td className="px-3 py-2">
                                  <Badge variant={confidenceBadge(field.confidence)} className="text-xs" title={`${confidenceLabel(field.confidence)} confidence`}>
                                    {confidenceLabel(field.confidence)} {Math.round(field.confidence * 100)}%
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 max-w-[200px] truncate text-xs text-muted-foreground font-mono">
                                  {Object.entries(field.constraints)
                                    .filter(([, v]) => v !== undefined)
                                    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
                                    .join(", ") || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {analysis.relationships.length > 0 && (
                        <div className="mt-4">
                          <h4 className="mb-2 text-sm font-medium">Relationships</h4>
                          <div className="space-y-1">
                            {analysis.relationships.map((rel, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="font-mono">{rel.from}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-mono">{rel.to}</span>
                                <Badge variant="outline" className="text-xs">{rel.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data">
                {results && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {results.map(r => {
                            const cfg = CATEGORY_CONFIG[r.category]
                            const Icon = cfg.icon
                            return (
                              <Button
                                key={r.category}
                                variant={activeCategory === r.category ? "default" : "outline"}
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => setActiveCategory(r.category)}
                              >
                                <Icon className="h-3 w-3" />
                                {cfg.label} ({r.records.length})
                              </Button>
                            )
                          })}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { if (results) copy(JSON.stringify(results, null, 2)) }}>
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Copied" : "Copy"}
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportJson}>
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const catData = results.find(r => r.category === activeCategory)
                        if (!catData || catData.records.length === 0) {
                          return <p className="text-sm text-muted-foreground">No data for this category</p>
                        }

                        const headers = Object.keys(catData.records[0])
                        const displayRecords = catData.records.slice(0, 25)

                        return (
                          <div>
                            {activeCategory === "security" && (
                              <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                                <div className="flex items-start gap-3">
                                  <Shield className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <div className="text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-semibold">Authorized Testing Only</p>
                                    <p className="mt-1">Security payloads are provided exclusively for testing systems you own or have explicit permission to test. QA Data Studio does not execute or transmit these payloads. You are responsible for appropriate use.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <p className="mb-2 text-xs text-muted-foreground">
                              {catData.metadata.description} — showing {displayRecords.length} of {catData.records.length}
                            </p>
                            <div className="max-h-[500px] overflow-auto rounded-md border">
                              <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-muted">
                                  <tr>
                                    {headers.map(h => (
                                      <th key={h} className="whitespace-nowrap border-b px-3 py-2 text-left font-medium text-muted-foreground">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayRecords.map((record, i) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                                      {headers.map(h => (
                                        <td key={h} className="max-w-[200px] truncate whitespace-nowrap px-3 py-1.5 font-mono">
                                          {record[h] === null ? (
                                            <span className="italic text-muted-foreground">null</span>
                                          ) : record[h] === undefined ? (
                                            <span className="italic text-muted-foreground">undefined</span>
                                          ) : (
                                            String(record[h]).length > 60
                                              ? String(record[h]).slice(0, 60) + "..."
                                              : String(record[h])
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
