"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Beaker, Database, Play, AlertCircle, HardDrive, Cpu, TerminalSquare } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModelInference } from "@/hooks/useModelInference"
import { AVAILABLE_MODELS, getCacheStats } from "@/lib/background-models"
import type { InferenceType } from "@/workers/model-inference.worker"

export function ModelLab() {
  const [activeTab, setActiveTab] = useState("playground")
  
  // Playground state
  const [selectedModelId, setSelectedModelId] = useState(AVAILABLE_MODELS[0].id)
  const [inputText, setInputText] = useState("Hello world! This is a test of the client-side AI system.")
  const [contextText, setContextText] = useState("Client-side AI allows models to run entirely in the browser using WebAssembly. This means no server costs and full data privacy.")
  const [targetLang, setTargetLang] = useState("German")
  
  const [result, setResult] = useState<any>(null)
  
  const { run, status, lastError } = useModelInference()

  // Debug/Compare state
  const [stats, setStats] = useState<any>(null)
  
  useEffect(() => {
    getCacheStats().then(setStats)
  }, [])

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId)

  // Mapping from our defined model tasks to inference types
  const taskToType: Record<string, InferenceType> = {
    'feature-extraction': 'embed',
    'summarization': 'summarize',
    'text-classification': 'classify',
    'token-classification': 'ner',
    'question-answering': 'qa',
    'text2text-generation': 'translate',
    'text-generation': 'generate'
  }

  const handleRun = async () => {
    if (!selectedModel) return
    const type = taskToType[selectedModel.task]
    if (!type) return

    setResult(null)
    
    try {
      const res = await run(type, selectedModel.id, inputText, {
        context: contextText,
        targetLang: targetLang
      })
      setResult(res)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text">Model Lab</h2>
          <div className="mt-1.5 h-0.5 w-20 rounded-full bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Test and evaluate client-side AI models running completely in your browser via WebAssembly.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 mt-6">
        <TabsList>
          <TabsTrigger value="playground" className="flex items-center gap-2"><Beaker className="h-4 w-4" /> Playground</TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2"><Activity className="h-4 w-4" /> Compare</TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2"><TerminalSquare className="h-4 w-4" /> Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-5 space-y-5 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Model</label>
                <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.task})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-[11px] text-muted-foreground">{selectedModel.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Input Text</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
              </div>

              {selectedModel?.task === 'question-answering' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Context (for QA)</label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                    value={contextText}
                    onChange={e => setContextText(e.target.value)}
                  />
                </div>
              )}

              {selectedModel?.task === 'text2text-generation' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Language</label>
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={handleRun} 
                disabled={status === 'working'}
                className="w-full gap-2"
              >
                {status === 'working' ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    Running Inference...
                  </>
                ) : (
                  <><Play className="h-4 w-4" /> Run Model</>
                )}
              </Button>
            </div>

            {/* Output Section */}
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-5 space-y-4 shadow-sm flex flex-col">
              <h3 className="text-sm font-medium flex items-center gap-2 border-b pb-2">
                <TerminalSquare className="h-4 w-4" /> Output
              </h3>
              
              <div className="flex-1 bg-black/40 rounded-lg border border-border/30 p-4 font-mono text-xs overflow-auto">
                {status === 'error' && (
                  <div className="text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{lastError}</span>
                  </div>
                )}
                
                {status === 'working' && !result && (
                  <div className="text-muted-foreground animate-pulse">Initializing inference engine...</div>
                )}

                {result && (
                  <div className="text-green-400/90 whitespace-pre-wrap break-all">
                    {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                  </div>
                )}
                
                {!result && status === 'idle' && (
                  <div className="text-muted-foreground">Ready to run inference. Ensure model is downloaded via the bottom-right manager first.</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compare">
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Model</th>
                    <th className="px-6 py-3 font-medium">Task</th>
                    <th className="px-6 py-3 font-medium">Size</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {AVAILABLE_MODELS.map((model) => (
                    <tr key={model.id} className="bg-transparent hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">{model.name}</td>
                      <td className="px-6 py-4 text-xs font-mono">{model.task}</td>
                      <td className="px-6 py-4">{model.size}</td>
                      <td className="px-6 py-4 text-muted-foreground">{model.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="debug">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-5 space-y-5 shadow-sm">
              <h3 className="text-sm font-medium flex items-center gap-2 border-b pb-2">
                <HardDrive className="h-4 w-4" /> IndexedDB Cache State
              </h3>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 p-3 rounded-lg border">
                      <div className="text-xs text-muted-foreground">Cached Models</div>
                      <div className="text-lg font-semibold">{stats.models.length}</div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border">
                      <div className="text-xs text-muted-foreground">Storage Used</div>
                      <div className="text-lg font-semibold">{Math.round(stats.totalSize / (1024*1024))} MB</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Quota Usage</span>
                      <span>{stats.quotaPercent}%</span>
                    </div>
                    <Progress value={stats.quotaPercent} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Loading cache stats...</div>
              )}
            </div>

            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-5 space-y-5 shadow-sm">
              <h3 className="text-sm font-medium flex items-center gap-2 border-b pb-2">
                <Cpu className="h-4 w-4" /> Environment Info
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">User Agent</span>
                  <span className="truncate max-w-[200px]" title={typeof navigator !== 'undefined' ? navigator.userAgent : ''}>
                    {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">Logical Cores</span>
                  <span>{typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">Device Memory (GB)</span>
                  <span>{typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? (navigator as any).deviceMemory : 'N/A'}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground">Web Workers Supported</span>
                  <span className="text-green-500">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

