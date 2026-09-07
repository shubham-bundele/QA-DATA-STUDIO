"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, HardDrive, ShieldCheck, Trash2, Download, Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  AVAILABLE_MODELS, 
  backgroundDownloader, 
  getCacheStats, 
  exportCache, 
  importCache, 
  deleteModelFromCache,
  clearModelCache,
  verifyModelIntegrity
} from "@/lib/background-models"

export function ModelDownloadManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDownloadingAny, setIsDownloadingAny] = useState(false)
  
  const [storageInfo, setStorageInfo] = useState({
    cached: 0,
    total: AVAILABLE_MODELS.length,
    sizeMB: 0,
    quotaPercent: 0
  })

  // Model statuses: { [id]: { status: 'ready'|'downloading'|'not-downloaded'|'error', progress: 0, error?: '' } }
  const [modelStatus, setModelStatus] = useState<Record<string, any>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshCacheStats = async () => {
    const stats = await getCacheStats()
    setStorageInfo({
      cached: stats.models.length,
      total: AVAILABLE_MODELS.length,
      sizeMB: Math.round(stats.totalSize / (1024 * 1024)),
      quotaPercent: stats.quotaPercent
    })

    const newStatus = { ...modelStatus }
    for (const m of AVAILABLE_MODELS) {
      if (stats.models.find(x => x.id === m.id)) {
        newStatus[m.id] = { status: 'ready', progress: 100 }
      } else if (!newStatus[m.id] || newStatus[m.id].status !== 'downloading') {
        newStatus[m.id] = { status: 'not-downloaded', progress: 0 }
      }
    }
    setModelStatus(newStatus)
  }

  useEffect(() => {
    refreshCacheStats()
    
    // Subscribe to progress for all models
    const unsubs = AVAILABLE_MODELS.map(m => {
      return backgroundDownloader.onProgress(m.id, (prog: any) => {
        setModelStatus(prev => {
          const newState = { ...prev }
          if (prog.status === 'ready') {
            newState[m.id] = { status: 'ready', progress: 100 }
            refreshCacheStats()
          } else if (prog.status === 'error') {
            newState[m.id] = { status: 'error', progress: 0, error: prog.error }
          } else if (prog.status === 'downloading' || prog.status === 'progress') {
            const pct = prog.progress || 0
            newState[m.id] = { status: 'downloading', progress: pct }
          }
          return newState
        })
      })
    })
    
    return () => unsubs.forEach(unsub => unsub())
  }, [])

  useEffect(() => {
    const anyDownloading = Object.values(modelStatus).some(s => s?.status === 'downloading')
    setIsDownloadingAny(anyDownloading)
  }, [modelStatus])

  const handleDownload = async (modelId: string) => {
    setModelStatus(prev => ({ ...prev, [modelId]: { status: 'downloading', progress: 0 } }))
    try {
      await backgroundDownloader.downloadModel(modelId)
    } catch (e) {
      // Error is handled via progress callback
    }
  }

  const handleDelete = async (modelId: string) => {
    await deleteModelFromCache(modelId)
    await refreshCacheStats()
  }

  const handleVerify = async (modelId: string) => {
    const ok = await verifyModelIntegrity(modelId)
    alert(ok ? "Model integrity verified!" : "Model verification failed or hash missing.")
  }

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all cached models?")) {
      await clearModelCache()
      await refreshCacheStats()
    }
  }

  const handleExport = async () => {
    const blob = await exportCache()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qa-models-cache.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await importCache(file)
      await refreshCacheStats()
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-4 pointer-events-auto">
        <div className="relative">
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/20 text-white relative"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bot className="h-6 w-6" />
          </Button>
          {isDownloadingAny && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-background"></span>
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-sm rounded-xl border border-border/50 bg-[#161618] text-foreground shadow-2xl flex flex-col pointer-events-auto"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            <div className="flex items-start justify-between p-4 pb-2 border-b border-border/10 shrink-0">
              <div>
                <h3 className="font-semibold text-[15px] text-white">Browser AI models</h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed pr-2">
                  Optional enhancement only. Server-side local AI is always primary.
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 rounded-md text-muted-foreground hover:text-white" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 text-sm flex-1">
              <div className="rounded-lg border border-border/10 bg-[#1c1c1e] p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    Storage
                  </div>
                  <span className="text-[11px] text-muted-foreground">IndexedDB</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Cached</div>
                    <div className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                      {storageInfo.cached} / {storageInfo.total}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Size</div>
                    <div className="text-[13px] font-semibold text-white">{storageInfo.sizeMB} MB</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">Quota</div>
                    <div className={`text-[13px] font-semibold ${storageInfo.quotaPercent > 90 ? 'text-red-400' : storageInfo.quotaPercent > 75 ? 'text-amber-400' : 'text-white'}`}>
                      {storageInfo.quotaPercent}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {AVAILABLE_MODELS.map((model) => {
                  const state = modelStatus[model.id] || { status: 'not-downloaded', progress: 0 }
                  const isReady = state.status === 'ready'
                  const isDownloading = state.status === 'downloading'
                  
                  return (
                    <div key={model.id} className="rounded-lg border border-border/10 bg-[#1c1c1e] p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-white">{model.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground whitespace-nowrap">
                              {model.size}
                            </span>
                            {isReady && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium whitespace-nowrap">
                                Ready
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">{model.description}</p>
                        </div>
                      </div>
                      
                      {isDownloading && (
                        <div className="space-y-1.5">
                          <Progress value={state.progress} className="h-1.5" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Downloading...</span>
                            <span>{Math.round(state.progress)}%</span>
                          </div>
                        </div>
                      )}

                      {state.status === 'error' && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span>{state.error}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        {!isReady && !isDownloading && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[11px] gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            onClick={() => handleDownload(model.id)}
                          >
                            <Download className="h-3 w-3" /> Download
                          </Button>
                        )}
                        {isReady && (
                          <>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 bg-transparent border-border/20 hover:bg-white/5 hover:text-white" onClick={() => handleVerify(model.id)}>
                              <ShieldCheck className="h-3 w-3" /> Verify
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 bg-transparent border-border/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => handleDelete(model.id)}>
                              <Trash2 className="h-3 w-3" /> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 pt-3 border-t border-border/10 shrink-0 bg-[#161618]">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button variant="outline" size="sm" className="h-8 text-[11px] bg-[#1c1c1e] border-border/10 hover:bg-white/5 hover:text-white" onClick={() => backgroundDownloader.downloadAllModels()}>
                  Download all
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] bg-[#1c1c1e] border-border/10 hover:bg-white/5 hover:text-white" onClick={() => backgroundDownloader.cancelAll()}>
                  Cancel all
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] bg-[#1c1c1e] border-border/10 hover:bg-white/5 hover:text-white" onClick={handleExport}>
                  Export
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] bg-[#1c1c1e] border-border/10 hover:bg-white/5 hover:text-white" onClick={() => fileInputRef.current?.click()}>
                  Import
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] bg-[#1c1c1e] border-border/10 hover:bg-destructive/10 hover:text-destructive" onClick={handleClearAll}>
                  Clear all
                </Button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImport} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

