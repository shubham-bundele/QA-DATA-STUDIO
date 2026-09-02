"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck, XCircle, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function ContractTestingPage() {
  const [schemaDefinition, setSchemaDefinition] = useState(`{
  "type": "object",
  "properties": {
    "userId": { "type": "string" },
    "role": { "type": "string", "enum": ["admin", "user"] }
  },
  "required": ["userId", "role"]
}`)
  const [jsonPayload, setJsonPayload] = useState(`{
  "userId": "123",
  "role": "guest"
}`)
  
  const [isValidating, setIsValidating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")

  const handleValidate = async () => {
    if (!schemaDefinition || !jsonPayload) return
    setIsValidating(true)
    setError("")
    setResults(null)

    try {
      const res = await fetch('/api/validate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaDefinition, jsonPayload })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to validate contract")
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="API Contract Testing" 
        description="Ensure your mock servers and APIs never drift from their OpenAPI specifications." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>OpenAPI / JSON Schema</CardTitle>
            <CardDescription>Paste the expected schema definition.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea 
              value={schemaDefinition}
              onChange={(e) => setSchemaDefinition(e.target.value)}
              className="mt-1 font-mono h-96 flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
              placeholder={'type: object\nproperties:\n  id:\n    type: integer\n  name:\n    type: string'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JSON Payload</CardTitle>
            <CardDescription>Paste the actual response body from your API or Mock.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea 
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
              className="mt-1 font-mono h-96 flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
              placeholder={'{\n  "id": 123,\n  "name": "Jane Doe"\n}'}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center py-4">
        <Button onClick={handleValidate} disabled={isValidating || !schemaDefinition || !jsonPayload} className="w-full max-w-md h-12 text-lg shadow-lg gap-2">
          {isValidating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Validate Contract Strict Match
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-center max-w-3xl mx-auto">
          {error}
        </div>
      )}

      {results && (
        <Card className={`max-w-3xl mx-auto border-2 ${results.isValid ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              {results.isValid ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold text-green-500">Contract Validated!</h2>
                  <p className="text-muted-foreground mt-2">The JSON payload matches the schema perfectly.</p>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mb-4" />
                  <h2 className="text-2xl font-bold text-red-500">Contract Violation Detected</h2>
                  <p className="text-muted-foreground mt-2">The payload drifts from the expected schema.</p>
                </>
              )}
            </div>

            {!results.isValid && results.errors?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-red-500 font-semibold flex items-center gap-2 mb-3 border-b border-red-500/20 pb-2">
                  <XCircle className="h-4 w-4" /> Critical Errors
                </h3>
                <ul className="space-y-2">
                  {results.errors.map((err: string, i: number) => (
                    <li key={i} className="text-sm font-mono bg-red-500/10 text-red-500 p-2 rounded-md">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.warnings?.length > 0 && (
              <div>
                <h3 className="text-amber-500 font-semibold flex items-center gap-2 mb-3 border-b border-amber-500/20 pb-2">
                  <AlertTriangle className="h-4 w-4" /> Warnings (Extra Fields)
                </h3>
                <ul className="space-y-2">
                  {results.warnings.map((warn: string, i: number) => (
                    <li key={i} className="text-sm font-mono bg-amber-500/10 text-amber-500 p-2 rounded-md">
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

