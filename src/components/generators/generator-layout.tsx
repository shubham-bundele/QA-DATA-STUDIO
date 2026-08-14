"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Trash2,
  Copy,
  Check,
  Download,
  Clock,
  Database,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { OutputViewer } from "@/components/generators/output-viewer"
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard"
import { useUnsavedChangesStore } from "@/stores/unsaved-changes-store"
import { exportData, triggerDownload } from "@/features/export/export.service"
import type { ExportFormat } from "@/core/types/common"

interface GeneratorLayoutProps {
  title: string
  description: string
  configPanel: React.ReactNode
  data: Record<string, unknown>[] | null
  isGenerating: boolean
  duration?: number
  onGenerate: () => void
  onClear: () => void
}

export function GeneratorLayout({
  title,
  description,
  configPanel,
  data,
  isGenerating,
  duration,
  onGenerate,
  onClear,
}: GeneratorLayoutProps) {
  const [viewMode, setViewMode] = useState<"table" | "json">("table")
  const { copy, copied } = useCopyToClipboard()
  const setDirty = useUnsavedChangesStore((s) => s.setDirty)

  useEffect(() => {
    setDirty(data !== null && data.length > 0)
    return () => setDirty(false)
  }, [data, setDirty])

  const handleCopy = async () => {
    if (!data) return
    await copy(JSON.stringify(data, null, 2))
    toast.success("Copied to clipboard")
  }

  const handleExport = (format: ExportFormat) => {
    if (!data) return
    try {
      const result = exportData({ data, format, options: {} })
      triggerDownload(result)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast.error("Export failed")
    }
  }

  const hasData = data && data.length > 0

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Config Panel - slides in from left */}
        <motion.div
          className="w-full shrink-0 lg:w-[380px]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {configPanel}

              <div className="flex gap-3 pt-2">
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className={cn(
                      "w-full relative overflow-hidden",
                      !isGenerating && "shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
                    )}
                  >
                    {isGenerating && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    <Play
                      className={cn(
                        "mr-2 h-4 w-4",
                        isGenerating && "animate-spin"
                      )}
                    />
                    {isGenerating ? "Generating..." : "Generate"}
                  </Button>
                </motion.div>
                <AnimatePresence>
                  {hasData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: "auto" }}
                      exit={{ opacity: 0, scale: 0.8, width: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button variant="outline" onClick={onClear}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Output Panel - slides in from right */}
        <motion.div
          className="min-w-0 flex-1"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">Output</CardTitle>
                  <AnimatePresence>
                    {hasData && (
                      <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Badge variant="secondary" className="gap-1">
                          <Database className="h-3 w-3" />
                          {data.length} {data.length === 1 ? "record" : "records"}
                        </Badge>
                        {duration !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {duration}ms
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {hasData && (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="gap-1.5"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Download className="h-3.5 w-3.5" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport("json")}>JSON</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport("csv")}>CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {hasData ? (
                  <motion.div
                    key="data"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Tabs
                      value={viewMode}
                      onValueChange={(v) => setViewMode(v as "table" | "json")}
                    >
                      <TabsList>
                        <TabsTrigger value="table">Table view</TabsTrigger>
                        <TabsTrigger value="json">JSON view</TabsTrigger>
                      </TabsList>
                      <TabsContent value="table">
                        <OutputViewer data={data} viewMode="table" />
                      </TabsContent>
                      <TabsContent value="json">
                        <OutputViewer data={data} viewMode="json" />
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EmptyState
                      icon={Database}
                      title="No data generated"
                      description="Configure your settings and click Generate to create test data."
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
