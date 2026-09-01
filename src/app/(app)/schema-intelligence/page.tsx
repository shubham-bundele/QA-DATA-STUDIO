"use client"

import { useState } from "react"
import { Upload, Play, FileJson, AlertTriangle, Loader2, CheckCircle, XCircle, Globe, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function SchemaIntelligencePage() {
  const [schemaInput, setSchemaInput] = useState(`{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample E-commerce API",
    "version": "1.0.0"
  },
  "paths": {
    "/products": {
      "get": {
        "summary": "List products",
        "responses": {
          "200": {
            "description": "A list of products"
          }
        }
      }
    }
  }
}`)
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState("")

  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({})

  async function handleAnalyze() {
    if (!schemaInput.trim()) return
    setIsProcessing(true)
    setError("")
    setResult(null)
    setTestResults({})

    try {
      const res = await fetch('/api/analyze-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: schemaInput })
      })

      if (!res.ok) {
        throw new Error("Failed to analyze schema")
      }

      const data = await res.json()
      setResult(data.analysis)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const [showLoadTestModal, setShowLoadTestModal] = useState(false)
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false)
  const [liveLoadTestResults, setLiveLoadTestResults] = useState<any | null>(null)
  const [loadTestConfig, setLoadTestConfig] = useState({
    vus: 20,
    rampUp: 10,
    sustain: 10,
    rampDown: 5
  })

  async function handleLiveLoadTest() {
    if (!result || !result.endpoints || !baseUrl) return;
    
    setIsRunningLoadTest(true);
    setLiveLoadTestResults(null);
    setShowLoadTestModal(false);

    try {
      const res = await fetch('/api/run-load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          endpoints: result.endpoints,
          vus: loadTestConfig.vus,
          duration: loadTestConfig.sustain // For live runner, we just use sustain time for simplicity
        })
      });
      const data = await res.json();
      if (data.success) {
        setLiveLoadTestResults(data.results);
      } else {
        alert("Load test failed: " + data.error);
      }
    } catch (err) {
      alert("Error running load test");
    } finally {
      setIsRunningLoadTest(false);
    }
  }

  function handleExportK6() {
    if (!result || !result.endpoints) return

    let script = `import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom Metrics
const myErrorRate = new Rate('api_error_rate');
const myLatencyTrend = new Trend('api_latency_trend');

export const options = {
  stages: [
    { duration: '${loadTestConfig.rampUp}s', target: ${loadTestConfig.vus} },
    { duration: '${loadTestConfig.sustain}s', target: ${loadTestConfig.vus} },
    { duration: '${loadTestConfig.rampDown}s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // 95% < 500ms, 99% < 1.5s
    http_req_failed: ['rate<0.01'], // Global failure rate < 1%
    api_error_rate: ['rate<0.05'], // Custom error rate
  }
};

const BASE_URL = '${baseUrl}';

export default function () {
  group('Schema-Driven Load Test', function () {
    let res;
    
`

    result.endpoints.forEach((ep: any, idx: number) => {
      // Find a positive test case to use for load testing
      const tc = ep.testCases?.find((t: any) => t.type === 'positive') || ep.testCases?.[0]
      if (!tc) return

      const payloadStr = tc.payload ? JSON.stringify(tc.payload) : 'null'
      
      script += `    // Endpoint ${idx + 1}: ${ep.method.toUpperCase()} ${ep.path}
    res = http.request('${ep.method.toUpperCase()}', \`\${BASE_URL}${ep.path}\`, ${payloadStr}, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });
    myLatencyTrend.add(res.timings.duration);
    let success = check(res, { '${ep.method.toUpperCase()} ${ep.path} status was 200/201': (r) => r.status >= 200 && r.status < 300 });
    myErrorRate.add(!success);
    sleep(1);
    
`
    })

    script += `  });\n}\n`

    const blob = new Blob([script], { type: "application/javascript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `load-test-${loadTestConfig.vus}vu.js`
    a.click()
    URL.revokeObjectURL(url)
    setShowLoadTestModal(false)
  }

  async function runTestCase(ep: any, tc: any, tcId: string) {
    if (!baseUrl) return;
    
    setRunningTests(prev => ({ ...prev, [tcId]: true }));
    try {
      const res = await fetch('/api/run-api-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          path: ep.path,
          method: ep.method,
          payload: tc.payload
        })
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [tcId]: data.result }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [tcId]: { status: 0, statusText: "Network Error", data: String(err), timeMs: 0 } }));
    } finally {
      setRunningTests(prev => ({ ...prev, [tcId]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Spec Analyzer & Test Runner"
        description="Upload an OpenAPI JSON to automatically generate and execute endpoint test cases."
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                OpenAPI / Swagger Input
              </CardTitle>
              <CardDescription>Paste your API specification (JSON format).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Target Base URL</Label>
                <Input 
                  id="baseUrl"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>

              <textarea
                value={schemaInput}
                onChange={e => setSchemaInput(e.target.value)}
                placeholder='{ "openapi": "3.0.0", "info": { ... } }'
                rows={16}
                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-sm resize-y"
              />
              <Button onClick={handleAnalyze} disabled={isProcessing || !schemaInput.trim()} className="w-full">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {isProcessing ? "Analyzing API Spec..." : "Analyze API"}
              </Button>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    Generated Test Cases & Execution
                  </CardTitle>
                  <CardDescription className="mt-1.5">Boundary and security tests ready to be executed.</CardDescription>
                </div>
                {result && (
                  <Button variant="outline" size="sm" onClick={() => setShowLoadTestModal(true)} disabled={isRunningLoadTest} className="shrink-0 gap-1.5">
                    {isRunningLoadTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {isRunningLoadTest ? "Load Testing..." : "Configure Load Test"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              {isRunningLoadTest && (
                <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-4 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">Running Live Performance Test...</p>
                  <p className="text-sm text-muted-foreground">Firing concurrent requests at {baseUrl}. Please wait.</p>
                </div>
              )}

              {liveLoadTestResults && (
                <div className="mb-4 rounded-md border border-green-500/20 bg-green-500/5 p-4">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4" />
                    Live Performance Test Completed
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Requests/sec</div>
                      <div className="text-xl font-bold">{liveLoadTestResults.requestsPerSecond}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Avg Latency</div>
                      <div className="text-xl font-bold">{liveLoadTestResults.avgLatencyMs}ms</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Success Rate</div>
                      <div className="text-xl font-bold">{liveLoadTestResults.successRate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase">Total Reqs</div>
                      <div className="text-xl font-bold">{liveLoadTestResults.totalRequests}</div>
                    </div>
                  </div>
                </div>
              )}

              {!result ? (
                <div className="flex flex-1 min-h-[400px] items-center justify-center text-sm text-muted-foreground border rounded-md border-dashed">
                  Awaiting schema analysis...
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2 pb-4">
                  {result.endpoints?.map((ep: any, idx: number) => (
                    <div key={idx} className="border rounded-md p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${ep.method.toUpperCase() === 'GET' ? 'bg-blue-500' : ep.method.toUpperCase() === 'POST' ? 'bg-green-500' : ep.method.toUpperCase() === 'PUT' ? 'bg-orange-500' : 'bg-red-500'}`}>
                          {ep.method.toUpperCase()}
                        </span>
                        <span className="font-mono text-sm font-semibold">{ep.path}</span>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        {ep.testCases?.map((tc: any, tcIdx: number) => {
                          const tcId = `${idx}-${tcIdx}`;
                          const isRunning = runningTests[tcId];
                          const tr = testResults[tcId];
                          
                          return (
                            <div key={tcIdx} className="bg-background border p-3 rounded-md text-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-primary">{tc.title}</p>
                                  <Badge variant="outline" className="mt-1 capitalize">{tc.type} Test</Badge>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => runTestCase(ep, tc, tcId)}
                                  disabled={isRunning}
                                  className="gap-1"
                                >
                                  {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                  {isRunning ? "Running..." : "Run"}
                                </Button>
                              </div>
                              
                              <div className="mt-3 text-xs font-mono bg-muted p-2 rounded max-h-[100px] overflow-y-auto">
                                <span className="text-muted-foreground block mb-1">Payload:</span>
                                {tc.payload ? JSON.stringify(tc.payload, null, 2) : "None"}
                              </div>

                              {tr && (
                                <div className={`mt-3 p-3 rounded-md border ${tr.status >= 200 && tr.status < 300 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {tr.status >= 200 && tr.status < 300 ? (
                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                      )}
                                      <span className="font-semibold text-sm">
                                        Status: {tr.status} {tr.statusText}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{tr.timeMs}ms</span>
                                  </div>
                                  <div className="text-xs font-mono bg-background/50 p-2 rounded max-h-[150px] overflow-y-auto mt-2">
                                    {typeof tr.data === 'object' ? JSON.stringify(tr.data, null, 2) : tr.data}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showLoadTestModal} onOpenChange={setShowLoadTestModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Load Test</DialogTitle>
            <DialogDescription>
              Set the traffic simulation parameters for your k6 load testing script.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vus" className="text-right">
                Virtual Users
              </Label>
              <Input
                id="vus"
                type="number"
                value={loadTestConfig.vus}
                onChange={(e) => setLoadTestConfig(p => ({...p, vus: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rampUp" className="text-right">
                Ramp Up (sec)
              </Label>
              <Input
                id="rampUp"
                type="number"
                value={loadTestConfig.rampUp}
                onChange={(e) => setLoadTestConfig(p => ({...p, rampUp: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sustain" className="text-right">
                Sustain (sec)
              </Label>
              <Input
                id="sustain"
                type="number"
                value={loadTestConfig.sustain}
                onChange={(e) => setLoadTestConfig(p => ({...p, sustain: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rampDown" className="text-right">
                Ramp Down (sec)
              </Label>
              <Input
                id="rampDown"
                type="number"
                value={loadTestConfig.rampDown}
                onChange={(e) => setLoadTestConfig(p => ({...p, rampDown: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLoadTestModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button variant="secondary" onClick={handleExportK6} className="w-full sm:w-auto gap-2">
              <Download className="h-4 w-4" /> Export k6
            </Button>
            <Button onClick={handleLiveLoadTest} className="w-full sm:w-auto gap-2">
              <Play className="h-4 w-4" /> Run Live Load Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
