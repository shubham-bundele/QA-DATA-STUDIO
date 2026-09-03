"use client"

import { useState, useEffect } from "react"
import { Shield, Play, Loader2, AlertTriangle, CheckCircle, ShieldAlert, Terminal, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type Log = {
  id: string;
  type: 'info' | 'progress' | 'finding' | 'safe' | 'done' | 'error';
  message?: string;
  attack?: string;
  severity?: string;
  details?: string;
  summary?: string;
}

export default function SecurityScannerPage() {
  const [url, setUrl] = useState("http://localhost:3000/api/users")
  const [method, setMethod] = useState("GET")
  const [isScanning, setIsScanning] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const targetUrl = params.get('targetUrl')
      if (targetUrl) {
        setUrl(targetUrl)
      }
    }
  }, [])
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [selectedVulnerability, setSelectedVulnerability] = useState("")
  const [backendFramework, setBackendFramework] = useState("Node.js (Express)")
  const [isGenerating, setIsGenerating] = useState(false)
  const [mitigationCode, setMitigationCode] = useState("")
  const [mitigationExplanation, setMitigationExplanation] = useState("")

  const handleAiMitigate = async () => {
    if (!selectedVulnerability) return
    setIsGenerating(true)
    setMitigationCode("")
    setMitigationExplanation("")
    try {
      const res = await fetch('/api/generate-mitigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerability: selectedVulnerability, framework: backendFramework })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMitigationCode(data.codeSnippet)
      setMitigationExplanation(data.explanation)
    } catch(e: any) {
      alert("Failed to generate AI mitigation: " + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const startScan = async () => {
    if (!url) return
    setIsScanning(true)
    setLogs([{ id: Date.now().toString(), type: 'info', message: 'Initializing automated penetration test...' }])

    try {
      const res = await fetch('/api/run-security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method })
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            setLogs(prev => [...prev, { id: Math.random().toString(), ...msg }])
            if (msg.type === 'done' || msg.type === 'error') {
               setIsScanning(false)
            }
          } catch(e) {}
        }
      }
    } catch (e) {
      setLogs(prev => [...prev, { id: Math.random().toString(), type: 'error', message: 'Failed to start scan.' }])
      setIsScanning(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Automated Security Scanner" 
        description="Run dynamic application security testing (DAST) on your API endpoints." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Target Setup
              </CardTitle>
              <CardDescription>Configure the endpoint to analyze.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Method</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Target URL</label>
                <Input 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="https://api.example.com/users" 
                  className="mt-1"
                />
              </div>
              <Button onClick={startScan} disabled={!url || isScanning} className="w-full gap-2">
                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isScanning ? "Scanning..." : "Launch Attack Simulation"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
             <CardContent className="p-4 text-xs text-muted-foreground">
                <strong>Disclaimer:</strong> Use this tool only on infrastructure you own or have explicit permission to test. This scanner will execute real injection payloads against the target.
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 h-[600px] flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-lg">
            <CardHeader className="bg-muted/30 border-b py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Scan Console
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto bg-black text-green-400 font-mono text-xs p-4 space-y-2">
              {logs.length === 0 && (
                 <div className="text-gray-500 italic">Ready to scan. Waiting for target...</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="animate-in fade-in duration-300">
                  {log.type === 'info' && <div className="text-blue-400">[*] {log.message}</div>}
                  {log.type === 'progress' && <div className="text-gray-400">[-] {log.message}</div>}
                  {log.type === 'safe' && <div className="text-green-500">[+] {log.attack}: SECURE</div>}
                  {log.type === 'finding' && (
                    <div className="text-red-500 bg-red-950/50 p-2 rounded border border-red-900 mt-1 mb-1 relative group">
                       <div className="font-bold flex items-center gap-2"><ShieldAlert className="h-4 w-4"/> VULNERABILITY DETECTED: {log.attack}</div>
                       <div className="text-red-400 mt-1">Severity: {log.severity}</div>
                       <div className="text-red-300">Evidence: {log.details}</div>
                       <Button 
                         onClick={() => {
                           setSelectedVulnerability(`Attack: ${log.attack}\nSeverity: ${log.severity}\nEvidence: ${log.details}`);
                           setIsAiModalOpen(true);
                         }} 
                         size="sm" 
                         variant="outline" 
                         className="absolute top-2 right-2 border-red-500/50 text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                       >
                         <Sparkles className="w-3 h-3" /> AI Mitigate
                       </Button>
                    </div>
                  )}
                  {log.type === 'done' && <div className="text-yellow-400 font-bold mt-4">=== {log.summary} ===</div>}
                  {log.type === 'error' && <div className="text-red-500">[!] ERROR: {log.message}</div>}
                </div>
              ))}
              {isScanning && (
                <div className="text-gray-500 flex items-center gap-2 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Scanning target...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto border-red-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
               <Sparkles className="h-5 w-5" />
               AI Threat Mitigation
            </DialogTitle>
            <DialogDescription>
              AI will analyze the payload that successfully penetrated your application and provide the exact backend code required to patch the vulnerability.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-red-400">Vulnerability Context</Label>
              <pre className="mt-1 p-3 bg-red-950/30 border border-red-900/50 rounded-md text-xs text-red-300 whitespace-pre-wrap font-mono">
                {selectedVulnerability}
              </pre>
            </div>
            
            <div className="w-[200px]">
              <Label>Backend Framework</Label>
              <Select value={backendFramework} onValueChange={setBackendFramework}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Node.js (Express)">Node.js (Express)</SelectItem>
                  <SelectItem value="Node.js (Next.js/React)">Node.js (Next.js/React)</SelectItem>
                  <SelectItem value="Python (Django/FastAPI)">Python</SelectItem>
                  <SelectItem value="Java (Spring Boot)">Java (Spring Boot)</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="PHP (Laravel)">PHP (Laravel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mitigationCode && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 pt-4 border-t border-border">
                <div>
                  <Label className="text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Recommended Patch</Label>
                  <pre className="mt-1 p-4 bg-black/50 border border-green-900/30 rounded-md text-sm text-green-300 overflow-x-auto font-mono">
                    {mitigationCode}
                  </pre>
                </div>
                <div>
                  <Label className="text-muted-foreground">Explanation</Label>
                  <p className="text-sm mt-1 text-gray-300">{mitigationExplanation}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)}>Close</Button>
            <Button onClick={handleAiMitigate} disabled={isGenerating} className="bg-red-600 hover:bg-red-700 text-white gap-2">
               {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
               {isGenerating ? "Analyzing Threat..." : "Generate Patch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

