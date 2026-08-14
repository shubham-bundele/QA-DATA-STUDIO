"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Trash2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { clearHistory } from "@/client/repositories/history.repository"
import { resetAnalytics } from "@/client/repositories/analytics.repository"

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun, description: "Clean and bright" },
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Match your OS" },
] as const

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [exportFormat, setExportFormat] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("qa-export-format") || "json"
    return "json"
  })
  const [recordCount, setRecordCount] = useState(() => {
    if (typeof window !== "undefined") return Number(localStorage.getItem("qa-record-count")) || 10
    return 10
  })
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    localStorage.setItem("qa-export-format", exportFormat)
  }, [exportFormat])

  useEffect(() => {
    localStorage.setItem("qa-record-count", String(recordCount))
  }, [recordCount])

  const handleClearHistory = async () => {
    setClearing(true)
    try {
      await clearHistory()
      await resetAnalytics()
      toast.success("All history cleared")
    } catch {
      toast.error("Failed to clear history")
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your preferences and application settings"
      />

      <motion.div
        className="grid gap-6 max-w-2xl"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Theme */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>
                Choose your preferred color scheme for the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = theme === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      aria-pressed={theme === option.value}
                      className={cn(
                        "group flex flex-col items-center gap-2.5 rounded-xl border-2 p-5 transition-all duration-300",
                        isActive
                          ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                          : "border-transparent bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                        isActive
                          ? "bg-primary/15 scale-110"
                          : "bg-muted group-hover:bg-muted/80 group-hover:scale-105"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-[11px] text-muted-foreground">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Default Export Format */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Default Export Format</CardTitle>
              <CardDescription>
                Select the default file format for exporting generated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label htmlFor="export-format" className="sr-only">
                  Export Format
                </Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="export-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Default Record Count */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Default Record Count</CardTitle>
              <CardDescription>
                Set the default number of records to generate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label htmlFor="record-count" className="sr-only">
                  Record Count
                </Label>
                <Input
                  id="record-count"
                  type="number"
                  value={recordCount}
                  onChange={(e) => {
                    const num = Number(e.target.value)
                    if (!isNaN(num) && num >= 1 && num <= 1000) {
                      setRecordCount(num)
                    }
                  }}
                  min={1}
                  max={1000}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <Card className="border-destructive/30 transition-all duration-300 hover:border-destructive/50 hover:shadow-md hover:shadow-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your stored data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleClearHistory}
                disabled={clearing}
                className="transition-all duration-300 hover:shadow-md hover:shadow-destructive/20"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {clearing ? "Clearing..." : "Clear All History"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
