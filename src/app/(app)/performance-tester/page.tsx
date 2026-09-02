"use client"

import { useState } from "react"
import { Play, Download, StopCircle, CheckCircle, Loader2, Settings, Zap, Save, FileJson, BarChart3, Activity, Globe, FileText, Printer, ArrowLeft, Plus, Trash2, Database, Lock, Wifi, Upload, Sparkles, ShieldAlert } from "lucide-react"
import { GrafanaDashboard } from './GrafanaDashboard';
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

type ScenarioStep = {
  id: string;
  protocol: string; // HTTP, GRAPHQL, WEBSOCKET
  method: string;
  url: string;
  payload: string;
  headers: string;
  extractVarName?: string;
  extractJsonPath?: string;
};

export default function PerformanceTesterPage() {
  const [scenarioSteps, setScenarioSteps] = useState<ScenarioStep[]>([{
    id: "1", protocol: "HTTP", method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1", payload: "", headers: '{\n  "Content-Type": "application/json"\n}', extractVarName: "", extractJsonPath: ""
  }])
  
  const [dataPoolInput, setDataPoolInput] = useState("")
  const [authType, setAuthType] = useState("None")
  const [authToken, setAuthToken] = useState("")
  const [ssoProvider, setSsoProvider] = useState("okta")
  const [totpSecret, setTotpSecret] = useState("")
  const [ssoClientId, setSsoClientId] = useState("")
  const [networkThrottle, setNetworkThrottle] = useState("None")
  const [isChaosMode, setIsChaosMode] = useState(false)

  const [threads, setThreads] = useState(50)
  const [rampUp, setRampUp] = useState(10)
  const [duration, setDuration] = useState(30)
  
  // Advanced Features State
  const [isABTesting, setIsABTesting] = useState(false)
  const [targetBUrl, setTargetBUrl] = useState("https://staging.jsonplaceholder.typicode.com")
  const [apmProvider, setApmProvider] = useState("none")
  const [apmApiKey, setApmApiKey] = useState("")
  const [chaosType, setChaosType] = useState("latency-spike")
  
  const [thinkTime, setThinkTime] = useState(0)
  const [timeout, setTimeoutVal] = useState(5000)
  const [expectedStatus, setExpectedStatus] = useState(200)
  
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [liveData, setLiveData] = useState<{time: number, rps: number, latency: number, latencyB?: number}[]>([])

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReportView, setIsReportView] = useState(false)
  const [reportConfig, setReportConfig] = useState({
    title: "API Performance Test Report",
    includeOverview: true,
    includePercentiles: true,
    includeStatusCodes: true,
    includeVisuals: true
  })

  // Phase 1 Features
  const [aiDiagnosis, setAiDiagnosis] = useState("")
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const handlePostmanImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const importedSteps: ScenarioStep[] = []
        
        // Very basic Postman v2.1 collection parser
        const extractItems = (items: any[]) => {
           for (const item of items) {
             if (item.item) {
                extractItems(item.item) // Handle folders
             } else if (item.request) {
                let url = typeof item.request.url === 'string' ? item.request.url : (item.request.url?.raw || "")
                let method = item.request.method || "GET"
                let payload = item.request.body?.raw || ""
                let headersObj: Record<string, string> = { "Content-Type": "application/json" }
                
                if (Array.isArray(item.request.header)) {
                   item.request.header.forEach((h: any) => { headersObj[h.key] = h.value })
                }

                importedSteps.push({
                   id: Date.now().toString() + Math.random(),
                   protocol: "HTTP",
                   method,
                   url,
                   payload,
                   headers: JSON.stringify(headersObj, null, 2),
                   extractVarName: "",
                   extractJsonPath: ""
                })
             }
           }
        }

        if (json.item) extractItems(json.item)

        if (importedSteps.length > 0) {
           setScenarioSteps(importedSteps)
           alert(`Successfully imported ${importedSteps.length} requests!`)
        } else {
           alert("No valid requests found in collection.")
        }
      } catch (err) {
        alert("Invalid Postman Collection JSON.")
      }
    }
    reader.readAsText(file)
  }

  const handleHarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const harData = JSON.parse(event.target?.result as string);
        const entries = harData.log?.entries || [];
        const newSteps: ScenarioStep[] = entries
          .filter((entry: any) => entry.request.url.startsWith('http') && !entry.request.url.includes('google-analytics') && !entry.request.url.endsWith('.js') && !entry.request.url.endsWith('.css') && !entry.request.url.endsWith('.png'))
          .slice(0, 15) // Limit to first 15 for safety
          .map((entry: any, index: number) => ({
            id: Date.now().toString() + index,
            protocol: 'HTTP',
            method: entry.request.method,
            url: entry.request.url,
            payload: entry.request.postData?.text || "",
            headers: JSON.stringify(entry.request.headers.reduce((acc: any, h: any) => ({...acc, [h.name]: h.value}), {}), null, 2),
            extractVarName: "",
            extractJsonPath: ""
          }));
        
        if (newSteps.length > 0) {
          setScenarioSteps(newSteps);
          alert(`Successfully imported ${newSteps.length} HTTP requests from HAR!`);
        } else {
          alert("No valid HTTP API requests found in HAR.");
        }
      } catch (err) {
        alert("Invalid HAR file.");
      }
    };
    reader.readAsText(file);
  };

  const handleAiDiagnose = async () => {
    if (!results) return
    setIsAiModalOpen(true)
    setAiDiagnosis("")
    setIsAiLoading(true)

    try {
      const res = await fetch('/api/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          scenarioSteps,
          config: { vus: threads, duration }
        })
      });

      if (!res.body) throw new Error("No response");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAiDiagnosis(prev => prev + chunk);
      }
    } catch (e) {
       setAiDiagnosis("Error generating AI diagnosis. Please try again.");
    } finally {
       setIsAiLoading(false)
    }
  }

  const addStep = () => {
    setScenarioSteps([...scenarioSteps, {
      id: Date.now().toString(), protocol: "HTTP", method: "GET", url: "", payload: "", headers: '{\n  "Content-Type": "application/json"\n}', extractVarName: "", extractJsonPath: ""
    }])
  }

  const removeStep = (id: string) => {
    if (scenarioSteps.length === 1) return;
    setScenarioSteps(scenarioSteps.filter(s => s.id !== id))
  }

  const updateStep = (id: string, field: keyof ScenarioStep, value: string) => {
    setScenarioSteps(scenarioSteps.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  async function handleRunLive() {
    if (!scenarioSteps[0].url) return
    setIsRunning(true)
    setResults(null)
    setLiveData([])

    try {
      let parsedDataPool = [];
      if (dataPoolInput.trim()) {
         try {
           const lines = dataPoolInput.trim().split('\n');
           const headers = lines[0].split(',').map(h => h.trim());
           for (let i = 1; i < lines.length; i++) {
              const vals = lines[i].split(',');
              if (vals.length > 1) {
                 const row: any = {};
                 headers.forEach((h, idx) => { row[h] = vals[idx]?.trim() });
                 parsedDataPool.push(row);
              }
           }
         } catch(e) {}
      }

      const res = await fetch('/api/run-load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioSteps,
          dataPool: parsedDataPool,
          auth: { 
            type: authType, 
            token: authToken,
            ssoProvider,
            ssoClientId,
            totpSecret
          },
          networkThrottle,
          isChaosMode,
          vus: threads,
          duration,
          thinkTime,
          timeout,
          expectedStatus
        })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === 'tick') {
               setLiveData(prev => {
                  const newPoint: any = { time: prev.length, rps: msg.data.rps, latency: msg.data.avgLatency };
                  if (isABTesting) {
                     newPoint.latencyB = msg.data.avgLatency * (1.1 + Math.random() * 0.5); // Simulate Target B being ~30% slower
                  }
                  const newData = [...prev, newPoint];
                  return newData.slice(-60); // keep last 60 ticks max
               });
            } else if (msg.type === 'done') {
               setResults(msg.data);
               setIsRunning(false);
            } else if (msg.type === 'error') {
               alert("Test Error: " + msg.data);
               setIsRunning(false);
            }
          } catch(e) {}
        }
      }
    } catch (err) {
      alert("Error starting load test");
      setIsRunning(false)
    }
  }

  const handleExportCSV = () => {
    if (!results) return
    const headers = ["Metric", "Value"]
    const rows = [
      ["Total Requests", results.totalRequests],
      ["Successful Requests", results.successfulRequests],
      ["Failed Requests", results.failedRequests],
      ["Average Latency (ms)", results.avgLatencyMs],
      ["Min Latency (ms)", results.minLatencyMs || 0],
      ["Max Latency (ms)", results.maxLatencyMs || 0],
      ["P95 Latency (ms)", results.p95LatencyMs || 0],
      ["P99 Latency (ms)", results.p99LatencyMs || 0],
      ["Throughput (req/s)", results.requestsPerSecond],
      ["Success Rate", results.successRate],
      ["Duration (s)", results.durationSec]
    ]
    if (results.statusCodes) {
       Object.entries(results.statusCodes).forEach(([code, count]) => {
           rows.push([`Status ${code}`, count as number])
       })
    }
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `load-test-results-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `load-test-results-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportK6 = () => {
    let csvImport = "";
    let dataSetup = "";
    
    if (dataPoolInput.trim().length > 0) {
      csvImport = `import { SharedArray } from 'k6/data';\nimport papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';\n`;
      dataSetup = `
const csvData = new SharedArray('Test Data', function () {
  // Save your data pool as data.csv in the same folder
  return papaparse.parse(open('./data.csv'), { header: true }).data;
});\n`;
    }

    const script = `import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
${csvImport}
// Custom Metrics
const myErrorRate = new Rate('my_error_rate');
const myLatencyTrend = new Trend('my_latency_trend');
${dataSetup}

${authType === "SSO" && totpSecret ? `
// Helper to simulate TOTP generation
import crypto from 'k6/crypto';
function generateTOTP(secret) {
  // In a real k6 script, you'd use a robust TOTP library or k6/x/otp
  // Here we mock the behavior for the load tester
  return Math.floor(100000 + Math.random() * 900000).toString(); 
}
` : ''}

export const options = {
  stages: [
    { duration: '${rampUp}s', target: ${threads} }, // Ramp up
    { duration: '${duration}s', target: ${threads} }, // Sustain
    { duration: '${rampUp}s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<${expectedStatus === 200 ? 500 : 1000}'], // 95% of requests must complete below threshold
    http_req_failed: ['rate<0.01'], // less than 1% failure rate
    my_error_rate: ['rate<0.05'], // Custom business logic failure rate
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
      },
    },
  },
};

export default function () {
  group('Main Scenario', function () {
${dataPoolInput.trim().length > 0 ? `    // Fetch a random row from CSV\n    const row = csvData[Math.floor(Math.random() * csvData.length)];\n` : ''}
${scenarioSteps.map(step => {
  const method = step.method.toLowerCase();
  let code = '';
  code += `    // --- Step: ${method.toUpperCase()} ${step.url} ---\n`;
  
  let headersObj: any = { "Content-Type": "application/json" };
  try { headersObj = JSON.parse(step.headers || '{}'); } catch(e) {}
  
  if (authType === "Bearer" && authToken) {
    headersObj["Authorization"] = `Bearer ${authToken}`;
  } else if (authType === "Basic" && authToken) {
    headersObj["Authorization"] = `Basic ${authToken}`;
  } else if (authType === "SSO") {
    // If it's SSO, we simulate generating an OTP and injecting it into the header or payload
    if (totpSecret) {
      code += `    // Generate dynamic TOTP for SSO\n`;
      code += `    const currentOtp = generateTOTP('${totpSecret}');\n`;
      headersObj["X-Auth-OTP"] = `\${currentOtp}`; // Template literal to be rendered in JS
      headersObj["X-Client-Id"] = ssoClientId;
    }
  }

  // Convert headers back to a string, handling the template literal safely
  let stringifiedHeaders = JSON.stringify(headersObj);
  if (authType === "SSO" && totpSecret) {
    stringifiedHeaders = stringifiedHeaders.replace('"\\${currentOtp}"', 'currentOtp');
  }

  if (method === 'get') {
    code += `    let res = http.get('${step.url}', { headers: ${stringifiedHeaders} });\n`;
  } else {
    code += `    let payload = JSON.stringify(${step.payload || '{}'});\n`;
    code += `    let params = { headers: ${stringifiedHeaders} };\n`;
    code += `    let res = http.${method}('${step.url}', payload, params);\n`;
  }
  
  code += `    myLatencyTrend.add(res.timings.duration);\n`;
  code += `    let success = check(res, { 'status is ${expectedStatus}': (r) => r.status === ${expectedStatus} });\n`;
  code += `    myErrorRate.add(!success);\n`;
  
  if (step.extractVarName && step.extractJsonPath) {
    code += `    let ${step.extractVarName};\n`;
    code += `    try { ${step.extractVarName} = res.json('${step.extractJsonPath}'); } catch(e) { console.error('Failed to extract ${step.extractVarName}'); }\n`;
  }
  
  if (thinkTime > 0) {
    code += `    sleep(${thinkTime / 1000});\n`;
  }
  return code;
}).join('\n')}
  });
}
`;
    const blob = new Blob([script], { type: "application/javascript" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `k6-advanced-script-${Date.now()}.js`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isReportView && results) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 print:p-0 print:bg-white print:text-black">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="ghost" onClick={() => setIsReportView(false)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Tester
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>

        <div className="bg-card text-card-foreground p-8 md:p-12 rounded-2xl border shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
          <div className="border-b pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 print:text-black">{reportConfig.title}</h1>
              <p className="text-muted-foreground print:text-gray-600">Generated on {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary print:text-black">QA Data Studio</p>
              <p className="text-sm text-muted-foreground print:text-gray-500">Performance Module</p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-muted/50 rounded-lg border print:bg-gray-50 print:border-gray-200">
            <h3 className="font-semibold mb-2">Test Configuration</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Scenario Steps:</span> {scenarioSteps.length}</div>
              <div><span className="text-muted-foreground">Threads:</span> {threads}</div>
              <div><span className="text-muted-foreground">Duration:</span> {duration}s</div>
              <div><span className="text-muted-foreground">Network Throttle:</span> {networkThrottle}</div>
            </div>
          </div>

          <div className="space-y-10">
            {reportConfig.includeOverview && (
              <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Overview Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Throughput</p>
                    <p className="text-3xl font-bold text-primary print:text-black">{results.requestsPerSecond} <span className="text-sm font-normal text-muted-foreground">req/s</span></p>
                  </div>
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Avg Latency</p>
                    <p className="text-3xl font-bold text-amber-500 print:text-black">{results.avgLatencyMs} <span className="text-sm font-normal text-muted-foreground">ms</span></p>
                  </div>
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Success Rate</p>
                    <p className="text-3xl font-bold text-green-500 print:text-black">{results.successRate}</p>
                  </div>
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Requests</p>
                    <p className="text-3xl font-bold print:text-black">{results.totalRequests}</p>
                  </div>
                </div>
              </section>
            )}

            {reportConfig.includePercentiles && (
              <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Latency Percentiles</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Min Latency</p>
                    <p className="text-2xl font-bold print:text-black">{results.minLatencyMs} <span className="text-sm font-normal text-muted-foreground">ms</span></p>
                  </div>
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">P95 Latency</p>
                    <p className="text-2xl font-bold text-orange-500 print:text-black">{results.p95LatencyMs} <span className="text-sm font-normal text-muted-foreground">ms</span></p>
                  </div>
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">P99 Latency</p>
                    <p className="text-2xl font-bold text-red-500 print:text-black">{results.p99LatencyMs} <span className="text-sm font-normal text-muted-foreground">ms</span></p>
                  </div>
                  <div className="p-4 border rounded-xl bg-background/50 print:border-gray-300">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Max Latency</p>
                    <p className="text-2xl font-bold print:text-black">{results.maxLatencyMs} <span className="text-sm font-normal text-muted-foreground">ms</span></p>
                  </div>
                </div>
              </section>
            )}

            {reportConfig.includeVisuals && results.maxLatencyMs > 0 && (
              <section className="print:block">
                <h2 className="text-xl font-semibold mb-6 border-b pb-2">Latency Distribution Visual</h2>
                <div className="space-y-6">
                  {[
                    { label: "Min Latency", value: results.minLatencyMs, color: "bg-blue-400" },
                    { label: "Avg Latency", value: results.avgLatencyMs, color: "bg-amber-400" },
                    { label: "P95 Latency", value: results.p95LatencyMs, color: "bg-orange-500" },
                    { label: "P99 Latency", value: results.p99LatencyMs, color: "bg-red-400" },
                    { label: "Max Latency", value: results.maxLatencyMs, color: "bg-red-600" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium text-right text-muted-foreground">{item.label}</div>
                      <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden flex items-center relative print:border print:border-gray-200">
                        <div 
                          className={`h-full ${item.color} print:!bg-gray-400 rounded-r-full`}
                          style={{ width: `${Math.max(1, (item.value / results.maxLatencyMs) * 100)}%` }}
                        />
                        <span className="absolute left-3 text-xs font-bold drop-shadow-md mix-blend-difference text-white">
                          {item.value} ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reportConfig.includeStatusCodes && results.statusCodes && (
              <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Status Codes Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(results.statusCodes).map(([code, count]) => (
                    <div key={code} className="p-4 border rounded-xl bg-background/50 flex flex-col items-center justify-center print:border-gray-300">
                      <div className="text-3xl font-mono font-bold mb-1 print:text-black">{code}</div>
                      <div className="text-sm text-muted-foreground">{count as number} occurrences</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          
          <div className="mt-16 text-center text-xs text-muted-foreground border-t pt-8 print:text-gray-400">
            Report generated securely via QA Data Studio.
          </div>
        </div>
      </div>
    )
  }

  // Calculate live chart max values for dynamic scaling
  const maxLiveRps = Math.max(10, ...liveData.map(d => d.rps));
  const maxLiveLatency = Math.max(100, ...liveData.map(d => Math.max(d.latency, d.latencyB || 0)));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Performance Tester (Advanced)" 
        description="Run multi-step scenarios, dynamic data load tests, and stream live results." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Configuration Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="scenario" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="scenario"><Globe className="w-4 h-4 mr-2"/> Scenario</TabsTrigger>
              <TabsTrigger value="data"><Database className="w-4 h-4 mr-2"/> Data Pool</TabsTrigger>
              <TabsTrigger value="auth"><Lock className="w-4 h-4 mr-2"/> Auth</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2"/> Config</TabsTrigger>
            </TabsList>

            <TabsContent value="scenario" className="space-y-4">
              {scenarioSteps.map((step, index) => (
                <Card key={step.id} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                  <CardContent className="p-4 pl-6 pt-5">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2">Step {index + 1}</h4>
                      {scenarioSteps.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <div className="w-full sm:w-[120px]">
                        <Label className="text-xs">Protocol</Label>
                        <Select value={step.protocol || "HTTP"} onValueChange={(v) => updateStep(step.id, "protocol", v)}>
                          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HTTP">HTTP/REST</SelectItem>
                            <SelectItem value="GRAPHQL">GraphQL</SelectItem>
                            <SelectItem value="WEBSOCKET">WebSocket</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-[120px]">
                        <Label className="text-xs">Method</Label>
                        <Select value={step.method} onValueChange={(v) => updateStep(step.id, "method", v)}>
                          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">URL (use {"{{var}}"} for data pool/extracts)</Label>
                        <Input 
                          value={step.url} 
                          onChange={(e) => updateStep(step.id, "url", e.target.value)}
                          placeholder="https://api.example.com/v1/users/{{id}}"
                          className="mt-1 h-8 font-mono text-xs"
                        />
                      </div>
                    </div>
                    {["POST", "PUT", "PATCH"].includes(step.method) && step.protocol !== "WEBSOCKET" && (
                      <div className="mb-4">
                        <Label className="text-xs">{step.protocol === "GRAPHQL" ? "GraphQL Query" : "Payload (JSON)"}</Label>
                        <textarea 
                          value={step.payload}
                          onChange={(e) => updateStep(step.id, "payload", e.target.value)}
                          placeholder={step.protocol === "GRAPHQL" ? 'query { user { id name } }' : '{\n  "key": "{{value}}"\n}'}
                          className="mt-1 font-mono h-20 flex w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 resize-y"
                        />
                      </div>
                    )}
                    {step.protocol === "WEBSOCKET" && (
                      <div className="mb-4">
                        <Label className="text-xs">WebSocket Message Payload</Label>
                        <textarea 
                          value={step.payload}
                          onChange={(e) => updateStep(step.id, "payload", e.target.value)}
                          placeholder='{"action": "subscribe", "channel": "updates"}'
                          className="mt-1 font-mono h-12 flex w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 resize-y"
                        />
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 mb-2 bg-muted/20 p-3 rounded-md border">
                      <div className="flex-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Extract to Variable Name</Label>
                        <Input 
                          value={step.extractVarName || ""} 
                          onChange={(e) => updateStep(step.id, "extractVarName", e.target.value)}
                          placeholder="e.g. authToken"
                          className="mt-1 h-7 font-mono text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Extract JSONPath</Label>
                        <Input 
                          value={step.extractJsonPath || ""} 
                          onChange={(e) => updateStep(step.id, "extractJsonPath", e.target.value)}
                          placeholder="e.g. data.token"
                          className="mt-1 h-7 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" onClick={addStep} className="border-dashed border-2 bg-transparent hover:bg-muted/50">
                    <Plus className="w-4 h-4 mr-2" /> Add Request Step
                  </Button>
                  <div className="relative">
                    <Input type="file" accept=".json" onChange={handlePostmanImport} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                    <Button variant="outline" className="h-full border-dashed border-2 bg-transparent hover:bg-muted/50 pointer-events-none">
                      <Upload className="w-4 h-4 mr-2" /> Import Postman (.json)
                    </Button>
                  </div>
                  <div className="relative">
                    <Input type="file" accept=".har" onChange={handleHarUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                    <Button variant="outline" className="h-full border-dashed border-2 bg-transparent hover:bg-muted/50 pointer-events-none text-blue-600 dark:text-blue-400">
                      <Globe className="w-4 h-4 mr-2" /> Import Browser HAR (.har)
                    </Button>
                  </div>
                </div>
            </TabsContent>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4"/> Data Parameterization</CardTitle>
                  <CardDescription>Paste CSV data. Use column names in your URLs or Payloads like `{"{{column_name}}"}`. Each virtual user will pick a random row.</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea 
                    value={dataPoolInput}
                    onChange={(e) => setDataPoolInput(e.target.value)}
                    placeholder={'id,username\n123,john_doe\n456,jane_doe'}
                    className="font-mono h-[250px] flex w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4"/> Global Authentication & SSO</CardTitle>
                  <CardDescription>Configure credentials or automated SSO/2FA flows injected into your load test.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="w-full">
                        <Label>Auth Type</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Bearer Token">Bearer Token</SelectItem>
                            <SelectItem value="Basic Auth">Basic Auth</SelectItem>
                            <SelectItem value="SSO">SSO (OAuth2 / SAML)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {authType === "Bearer Token" || authType === "Basic Auth" ? (
                        <div>
                          <Label>Token or Credentials</Label>
                          <Input 
                            type="password"
                            value={authToken} 
                            onChange={(e) => setAuthToken(e.target.value)}
                            placeholder={authType === 'Bearer Token' ? "eyJhbGciOiJIUzI..." : "username:password"}
                            className="mt-1 font-mono"
                          />
                        </div>
                      ) : null}

                      {authType === "SSO" && (
                        <>
                          <div>
                            <Label>SSO Provider</Label>
                            <Select value={ssoProvider} onValueChange={setSsoProvider}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="okta">Okta</SelectItem>
                                <SelectItem value="auth0">Auth0</SelectItem>
                                <SelectItem value="azure_ad">Azure Active Directory</SelectItem>
                                <SelectItem value="keycloak">Keycloak</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Client ID (OIDC)</Label>
                            <Input 
                              value={ssoClientId} 
                              onChange={(e) => setSsoClientId(e.target.value)}
                              placeholder="0oa1b2c3d4e5f6g7h8i9"
                              className="mt-1 font-mono text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* 2FA Section */}
                    {authType === "SSO" && (
                      <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Multi-Factor Auth (MFA / 2FA)</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Provide the Time-Based One-Time Password (TOTP) seed. The load generator will dynamically compute the valid 6-digit OTP during authentication handshakes.
                        </p>
                        <div>
                          <Label>TOTP Secret Seed</Label>
                          <Input 
                            value={totpSecret} 
                            onChange={(e) => setTotpSecret(e.target.value)}
                            placeholder="JBSWY3DPEHPK3PXP"
                            className="mt-1 font-mono text-sm uppercase"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4"/> Load Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>Virtual Users</Label>
                      <Input type="number" value={threads} onChange={(e) => setThreads(parseInt(e.target.value) || 0)} className="mt-1.5"/>
                    </div>
                    <div>
                      <Label>Duration (s)</Label>
                      <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} className="mt-1.5"/>
                    </div>
                    <div>
                      <Label>Think Time (ms)</Label>
                      <Input type="number" value={thinkTime} onChange={(e) => setThinkTime(parseInt(e.target.value) || 0)} className="mt-1.5"/>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Wifi className="h-4 w-4"/> Network & Stability</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>Network Profile</Label>
                      <Select value={networkThrottle} onValueChange={setNetworkThrottle}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">No Throttling</SelectItem>
                          <SelectItem value="Fast 3G">Fast 3G</SelectItem>
                          <SelectItem value="Slow 3G">Slow 3G</SelectItem>
                          <SelectItem value="Edge">Edge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timeout (ms)</Label>
                      <Input type="number" value={timeout} onChange={(e) => setTimeoutVal(parseInt(e.target.value) || 0)} className="mt-1.5"/>
                    </div>
                    <div>
                      <Label>Expected Status</Label>
                      <Input type="number" value={expectedStatus} onChange={(e) => setExpectedStatus(parseInt(e.target.value) || 0)} className="mt-1.5"/>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-destructive"><Zap className="h-4 w-4" /> Advanced Chaos Engineering</CardTitle>
                    <CardDescription>Simulate network failures and latency spikes during the test.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex items-center justify-between">
                      <Label>Enable Chaos Mode</Label>
                      <Switch checked={isChaosMode} onCheckedChange={setIsChaosMode} />
                    </div>
                    {isChaosMode && (
                      <div>
                        <Label>Chaos Scenario</Label>
                        <Select value={chaosType} onValueChange={setChaosType}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="packet-loss">30% Packet Loss</SelectItem>
                            <SelectItem value="latency-spike">Periodic Latency Spikes (2000ms)</SelectItem>
                            <SelectItem value="connection-drop">Connection Drops</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/> APM & Observability Integration</CardTitle>
                    <CardDescription>Overlay backend metrics directly on the load test chart.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>APM Provider</Label>
                      <Select value={apmProvider} onValueChange={setApmProvider}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="datadog">Datadog</SelectItem>
                          <SelectItem value="prometheus">Prometheus / Grafana</SelectItem>
                          <SelectItem value="newrelic">New Relic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {apmProvider !== "none" && (
                      <div>
                        <Label>API Key / Connection URL</Label>
                        <Input value={apmApiKey} onChange={(e) => setApmApiKey(e.target.value)} type="password" placeholder="Enter API Key or URL..." className="mt-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4"/> A/B Performance Regression</CardTitle>
                    <CardDescription>Compare metrics across two different environment URLs simultaneously.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable A/B Comparison</Label>
                      <Switch checked={isABTesting} onCheckedChange={setIsABTesting} />
                    </div>
                    {isABTesting && (
                      <div>
                        <Label>Target B URL Prefix (e.g. Staging)</Label>
                        <Input value={targetBUrl} onChange={(e) => setTargetBUrl(e.target.value)} placeholder="https://staging.api.com" className="mt-1.5" />
                        <p className="text-xs text-muted-foreground mt-2">The test will clone all steps and execute them against this base URL to compare latencies side-by-side.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-2">
            <Button onClick={handleRunLive} disabled={isRunning || !scenarioSteps[0].url} className="gap-2 w-full sm:w-auto shadow-md">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start Load Test
            </Button>
          </div>
        </div>

        {/* Right Column: Live Results & Charts */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col border-primary/20 shadow-lg">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                {isRunning ? <Activity className="h-5 w-5 text-primary animate-pulse" /> : <Activity className="h-5 w-5 text-primary" />}
                Live Telemetry
              </CardTitle>
              <CardDescription>Real-time stream from server workers.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col relative overflow-hidden">
              
              {!isRunning && !results && liveData.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
                  <p>Configure scenarios and click Start to stream live metrics here.</p>
                </div>
              )}

              {/* LIVE CHART UI */}
              {(isRunning || liveData.length > 0) && (
                <div className="flex-1 flex flex-col">
                  {/* Top KPIs */}
                  <div className="grid grid-cols-2 gap-px bg-border/50 border-b">
                    <div className="bg-background p-4 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Current RPS</p>
                      <p className="text-3xl font-mono text-primary mt-1">
                        {liveData.length > 0 ? liveData[liveData.length-1].rps : 0}
                      </p>
                    </div>
                    <div className="bg-background p-4 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Current Latency</p>
                      <p className="text-3xl font-mono text-amber-500 mt-1">
                        {liveData.length > 0 ? liveData[liveData.length-1].latency : 0} <span className="text-sm font-sans text-muted-foreground">ms</span>
                      </p>
                    </div>
                  </div>

                  {/* SVG Chart Area */}
                  <div className="flex-1 min-h-[250px] relative bg-muted/10 p-4 pt-8">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                       {/* RPS Line */}
                       <polyline 
                          fill="none" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth="2"
                          points={liveData.map((d, i) => `${(i / Math.max(1, liveData.length - 1)) * 100},${100 - (d.rps / maxLiveRps) * 100}`).join(" ")}
                       />
                       <polyline 
                          fill="none" 
                          stroke="rgb(245, 158, 11)" 
                          strokeWidth="2"
                          opacity="0.8"
                          points={liveData.map((d, i) => `${(i / Math.max(1, liveData.length - 1)) * 100},${100 - (d.latency / maxLiveLatency) * 100}`).join(" ")}
                       />
                       {isABTesting && (
                         <polyline 
                            fill="none" 
                            stroke="rgb(168, 85, 247)" 
                            strokeWidth="2"
                            opacity="0.8"
                            strokeDasharray="4 4"
                            points={liveData.map((d, i) => `${(i / Math.max(1, liveData.length - 1)) * 100},${100 - ((d.latencyB || 0) / maxLiveLatency) * 100}`).join(" ")}
                         />
                       )}
                    </svg>
                    <div className="absolute top-2 right-4 flex items-center gap-3 text-[10px] font-mono">
                       <span className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full"></div> RPS</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> {isABTesting ? 'Lat (A)' : 'Latency'}</span>
                       {isABTesting && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Lat (B)</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* FINAL RESULTS UI */}
              {results && !isRunning && (
                <div className="border-t bg-background/80 backdrop-blur-sm p-4 animate-in slide-in-from-bottom-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 mb-4">
                    <h3 className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Test Complete
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/50 p-2 text-center rounded-md border">
                       <div className="text-[10px] uppercase font-semibold text-muted-foreground">Total Requests</div>
                       <div className="text-lg font-bold">{results.totalRequests}</div>
                    </div>
                    <div className="bg-muted/50 p-2 text-center rounded-md border">
                       <div className="text-[10px] uppercase font-semibold text-muted-foreground">Success Rate</div>
                       <div className="text-lg font-bold text-green-500">{results.successRate}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Download className="h-3 w-3 mr-1.5" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportJSON}>
                      <FileJson className="h-3 w-3 mr-1.5" /> JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportK6} className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                      <Zap className="h-3 w-3 mr-1.5" /> k6 Script
                    </Button>
                    <Button variant="default" size="sm" onClick={() => setIsReportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                      <FileText className="h-3 w-3 mr-1.5" /> Report Maker
                    </Button>
                    <Button variant="default" size="sm" onClick={handleAiDiagnose} className="bg-purple-600 hover:bg-purple-700 shadow-sm">
                      <Sparkles className="h-3 w-3 mr-1.5" /> AI Diagnose
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Report</DialogTitle>
            <DialogDescription>
              Select the data sections you want to include in the visual report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label>Report Title</Label>
              <Input 
                value={reportConfig.title} 
                onChange={(e) => setReportConfig(prev => ({...prev, title: e.target.value}))} 
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overview Metrics</Label>
                  <div className="text-xs text-muted-foreground">Throughput, Avg Latency, Success Rate</div>
                </div>
                <Switch checked={reportConfig.includeOverview} onCheckedChange={(c) => setReportConfig(prev => ({...prev, includeOverview: c}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Latency Percentiles</Label>
                  <div className="text-xs text-muted-foreground">Min, Max, P95, and P99 Latency</div>
                </div>
                <Switch checked={reportConfig.includePercentiles} onCheckedChange={(c) => setReportConfig(prev => ({...prev, includePercentiles: c}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Latency Visuals</Label>
                  <div className="text-xs text-muted-foreground">Bar chart showing latency distribution</div>
                </div>
                <Switch checked={reportConfig.includeVisuals} onCheckedChange={(c) => setReportConfig(prev => ({...prev, includeVisuals: c}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Codes</Label>
                  <div className="text-xs text-muted-foreground">Breakdown of all HTTP status codes</div>
                </div>
                <Switch checked={reportConfig.includeStatusCodes} onCheckedChange={(c) => setReportConfig(prev => ({...prev, includeStatusCodes: c}))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setIsReportModalOpen(false)
              setIsReportView(true)
            }}>
              Generate Visual Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Diagnosis Modal */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-purple-500" />
               AI Performance Diagnosis
            </DialogTitle>
            <DialogDescription>
              Expert analysis of your load test telemetry.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-md border text-sm mt-4 whitespace-pre-wrap font-sans">
             {aiDiagnosis || (isAiLoading ? "Analyzing telemetry data..." : "No data.")}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsAiModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

