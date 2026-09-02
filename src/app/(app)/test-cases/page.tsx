"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClipboardList,
  Sparkles,
  FlaskConical,
  Link as LinkIcon,
  Download,
  Copy,
  Check,
  Clock,
  ChevronRight,
  AlertTriangle,
  Shield,
  Target,
  Zap,
  Terminal,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ExportWebhookModal } from "@/components/export-webhook-modal"
import { HistoryModal } from "@/components/history-modal"
import { PlaywrightPreviewModal } from "@/components/playwright-preview-modal"
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { saveStoryResult } from "@/core/db/history-db"

// ---------------------------------------------------------------------------
// Types (mirrors the engine's exported interfaces)
// ---------------------------------------------------------------------------

interface TestCase {
  id: string
  title: string
  category: "positive" | "negative" | "boundary" | "security"
  priority: "high" | "medium" | "low"
  gherkin: {
    given: string
    when: string
    then: string
  }
  domain: string
  generatorLink: string
  dataFields: string[]
}

interface DetectedDomain {
  domain: string
  confidence: number
  keywords: string[]
  generatorLink: string
}

interface AnalysisResult {
  userStory: string
  detectedDomains: DetectedDomain[]
  testCases: TestCase[]
  summary: {
    totalCases: number
    byCategory: Record<string, number>
    byDomain: Record<string, number>
    byPriority: Record<string, number>
  }
  decomposition: {
    actors: string[];
    actions: string[];
    preconditions: string[];
    outcomes: string[];
    edgeCases: string[];
  }
  gherkinFeatures: {
    featureName: string;
    scenarios: {
      name: string;
      type: string;
      given: string;
      when: string;
      then: string;
    }[];
  }[]
  recommendations: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAMPLE_STORIES: Record<string, string> = {
  "User Registration":
    "As a new user, I want to register with my name, email, and password so that I can create an account and access the platform",
  "Checkout Flow":
    "As a customer, I want to enter my shipping address and credit card details so that I can complete my purchase",
  "Bank Transfer":
    "As an account holder, I want to transfer money to another account using their IBAN so that I can send payments",
  "API Integration":
    "As a developer, I want to send a JSON payload to the user registration endpoint so that I can create users programmatically",
}

type TestCategory = "positive" | "negative" | "boundary" | "security"

const CATEGORY_CONFIG: Record<
  TestCategory,
  { label: string; icon: typeof Sparkles; color: string; badgeClass: string }
> = {
  positive: {
    label: "Positive",
    icon: Sparkles,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  negative: {
    label: "Negative",
    icon: AlertTriangle,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  },
  boundary: {
    label: "Boundary",
    icon: Target,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  security: {
    label: "Security",
    icon: Shield,
    color: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
}

const PRIORITY_CONFIG: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}



// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function TestCasesPage() {
    const { testCases, setTestCases } = useWorkspaceStore()
  const { storyInput, isAnalyzing, duration, error } = testCases
  const result = testCases.result as AnalysisResult | null
  const [activeTab, setActiveTab] = useState("all")
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPlaywrightModal, setShowPlaywrightModal] = useState(false)
  const { copy, copied } = useCopyToClipboard()

  // -- Load sample story --------------------------------------------------

  const loadSample = useCallback((key: string) => {
    const story = SAMPLE_STORIES[key]
    if (story) {      setTestCases({ storyInput: story, result: null, duration: undefined, error: "" })
    }
  }, [])

  const loadHistoryResult = useCallback((pastResult: AnalysisResult) => {      setTestCases({ result: pastResult, storyInput: pastResult.userStory || "", duration: 0, error: "" })
      setActiveTab("all")
  }, [])

  // -- Analyze -------------------------------------------------------------

  async function handleAnalyze() {
    const trimmed = storyInput.trim()
    if (!trimmed) return

    setTestCases({ isAnalyzing: true, error: "", result: null })
    const start = performance.now()

    try {
      const res = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: trimmed })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Server error during analysis')
      }
      
      const analysis = await res.json()
      const elapsed = Math.round(performance.now() - start)
      setTestCases({ result: analysis, duration: elapsed })
      setActiveTab("all")
      
      try {
        await saveStoryResult(analysis)
      } catch (e) {
        console.error("Failed to save to history", e)
      }
      
      toast.success(
        `Generated ${analysis.summary.totalCases} test cases in ${elapsed}ms`
      )
    } catch (err) {
      setTestCases({ error: `Analysis failed. ${err instanceof Error ? err.message : "Please check your input and try again."}` })
    } finally {      setTestCases({ isAnalyzing: false })
    }
  }

  // -- Export helpers -------------------------------------------------------

  function formatTestCasesAsText(cases: TestCase[]): string {
    return cases
      .map((tc, i) => {
        return [
          `${i + 1}. ${tc.title}`,
          `   Category: ${tc.category} | Priority: ${tc.priority} | Domain: ${tc.domain}`,
          `   Given ${tc.gherkin.given}`,
          `   When  ${tc.gherkin.when}`,
          `   Then  ${tc.gherkin.then}`,
          tc.dataFields.length > 0
            ? `   Data fields: ${tc.dataFields.join(", ")}`
            : null,
          "",
        ]
          .filter(Boolean)
          .join("\n")
      })
      .join("\n")
  }

  function handleCopyAll() {
    if (!result) return
    copy(formatTestCasesAsText(result.testCases))
    toast.success("Test cases copied to clipboard")
  }

  function handleDownloadJson() {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "test-cases.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportCSV() {
    if (!result || !result.testCases) return
    
    // Standard CSV headers for Jira/Zephyr/TestRail
    const headers = ["ID", "Title", "Preconditions", "Steps", "Expected Result", "Priority", "Category", "Domain"]
    
    const rows = result.testCases.map(tc => {
      const steps = tc.gherkin.when.split(/ and /i).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')
      
      return [
        tc.id,
        tc.title,
        tc.gherkin.given,
        steps,
        tc.gherkin.then,
        tc.priority,
        tc.category,
        tc.domain
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "test-cases.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // -- Derived data --------------------------------------------------------

  const filteredCases =
    result?.testCases.filter(
      (tc) => activeTab === "all" || tc.category === activeTab
    ) ?? []

  // -- Render --------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Case Generator"
        description="Paste a user story to auto-generate test cases and identify required test data"
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ---------------------------------------------------------------- */}
        {/* Left Panel -- Input                                              */}
        {/* ---------------------------------------------------------------- */}
        <motion.div
          className="w-full shrink-0 xl:w-[480px]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">User Story</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Sample buttons */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Quick examples
                  </label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setShowHistoryModal(true)}
                  >
                    View History
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(SAMPLE_STORIES).map((key) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => loadSample(key)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={storyInput}
                onChange={(e) => setTestCases({ storyInput: e.target.value })}
                placeholder="As a user, I want to register with my email and password so that I can access my account"
                rows={7}
                aria-label="User story input"
                className="w-full rounded-lg border border-input/60 bg-background/50 backdrop-blur-sm px-4 py-3 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 hover:border-border resize-y"
              />

              {/* Analyze button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !storyInput.trim()}
                  className={cn(
                    "w-full relative overflow-hidden",
                    !isAnalyzing &&
                      "shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30"
                  )}
                >
                  {isAnalyzing && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                  <Sparkles
                    className={cn(
                      "mr-2 h-4 w-4",
                      isAnalyzing && "animate-spin"
                    )}
                  />
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </motion.div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              {/* Status */}
              {result && !error && (
                <p className="text-sm text-muted-foreground">
                  Generated {result.summary.totalCases} test cases
                  {duration !== undefined && (
                    <span className="ml-2 text-xs">({duration}ms)</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* Right Panel -- Results                                           */}
        {/* ---------------------------------------------------------------- */}
        <motion.div
          className="min-w-0 flex-1"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={FlaskConical}
                      title="Paste a user story to begin"
                      description="Write or select a user story, then click Analyze to auto-generate test cases with linked test data generators."
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* ====== Summary Bar ====== */}
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Total */}
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">
                          {result.summary.totalCases} test cases
                        </span>
                      </div>

                      <div className="h-4 w-px bg-border" />

                      {/* Category counts */}
                      {(
                        Object.entries(result.summary.byCategory) as [
                          TestCategory,
                          number,
                        ][]
                      ).map(([cat, count]) => {
                        const cfg = CATEGORY_CONFIG[cat]
                        if (!cfg) return null
                        const Icon = cfg.icon
                        return (
                          <Badge
                            key={cat}
                            variant="outline"
                            className={cn("gap-1", cfg.badgeClass)}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.label} {count}
                          </Badge>
                        )
                      })}

                      <div className="h-4 w-px bg-border" />

                      {/* Duration */}
                      {duration !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {duration}ms
                        </span>
                      )}

                      {/* Spacer + Export buttons */}
                      <div className="ml-auto flex flex-wrap items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto justify-start sm:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={handleCopyAll}
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copied ? "Copied" : "Copy All"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={handleDownloadJson}
                        >
                          <Download className="h-3 w-3" />
                          JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={handleExportCSV}
                        >
                          <Download className="h-3 w-3" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setShowPlaywrightModal(true)}
                        >
                          <Terminal className="h-3 w-3" />
                          Playwright
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={() => setShowWebhookModal(true)}
                        >
                          <Zap className="h-3 w-3" />
                          Push to Jira
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ====== Story Decomposition ====== */}
                {result.decomposition && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-tight">
                      Story Decomposition
                    </h3>
                    <Card>
                      <CardContent className="grid gap-4 sm:grid-cols-2 p-4 text-sm">
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Actors</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {result.decomposition.actors.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Actions</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {result.decomposition.actions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Preconditions</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {result.decomposition.preconditions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Outcomes</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {result.decomposition.outcomes.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-muted-foreground mb-1">Edge Cases</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {result.decomposition.edgeCases.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ====== Section 1: Structured Test Cases ====== */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold tracking-tight">
                    Section 1: Structured Test Cases
                  </h3>
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="mb-2 flex-wrap h-auto">
                      <TabsTrigger value="all">
                        All ({result.testCases.length})
                      </TabsTrigger>
                      {(
                        Object.entries(CATEGORY_CONFIG) as [
                          TestCategory,
                          (typeof CATEGORY_CONFIG)[TestCategory],
                        ][]
                      ).map(([cat, cfg]) => {
                        const count = result.summary.byCategory[cat] ?? 0
                        if (count === 0) return null
                        return (
                          <TabsTrigger key={cat} value={cat}>
                            {cfg.label} ({count})
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {/* Shared content for all tab values */}
                    {["all", "positive", "negative", "boundary", "security"].map(
                      (tabValue) => (
                        <TabsContent key={tabValue} value={tabValue}>
                          <div className="space-y-3">
                            {filteredCases.length === 0 ? (
                              <p className="py-8 text-center text-sm text-muted-foreground">
                                No test cases in this category
                              </p>
                            ) : (
                              filteredCases.map((tc, idx) => (
                                <TestCaseCard
                                  key={tc.id}
                                  testCase={tc}
                                  index={idx}
                                />
                              ))
                            )}
                          </div>
                        </TabsContent>
                      )
                    )}
                  </Tabs>
                </div>

                {/* ====== Section 2: Plain Text Test Cases ====== */}
                {result.testCases && result.testCases.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-tight">
                      Section 2: Plain Text Test Cases
                    </h3>
                    <Card>
                      <CardContent className="p-0 overflow-hidden">
                        <pre className="p-4 text-xs bg-muted/30 overflow-auto max-h-[400px]">
                          {result.testCases.map(tc => {
                            const precondition = tc.gherkin.given;
                            const steps = tc.gherkin.when.split(/ and /i).map((s, i) => `  ${i + 1}. ${s.trim().charAt(0).toUpperCase() + s.trim().slice(1)}`);
                            const expected = tc.gherkin.then;
                            return `${tc.id}: ${tc.title}\n` +
                                   `Preconditions: ${precondition}\n` +
                                   `Steps:\n${steps.join("\n")}\n` +
                                   `Expected Result: ${expected}\n`;
                          }).join('\n')}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ====== Section 3: Additional Recommendations ====== */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-tight">
                      Section 3: Additional Recommendations
                    </h3>
                    <Card>
                      <CardContent className="p-4 text-sm space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ExportWebhookModal
        open={showWebhookModal}
        onOpenChange={setShowWebhookModal}
        payload={result}
      />
      <HistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        onSelect={loadHistoryResult}
      />
      <PlaywrightPreviewModal
        open={showPlaywrightModal}
        onOpenChange={setShowPlaywrightModal}
        payload={result}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Test Case Card Component
// ---------------------------------------------------------------------------

function TestCaseCard({
  testCase: tc,
  index,
}: {
  testCase: TestCase
  index: number
}) {
  const catCfg = CATEGORY_CONFIG[tc.category]
  const CatIcon = catCfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card className="overflow-hidden transition-colors hover:border-primary/30">
        <CardContent className="py-4">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-snug">
              <span className="text-muted-foreground mr-2 font-mono text-xs">{tc.id}</span>
              {tc.title}
            </h4>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("gap-1 text-[11px]", catCfg.badgeClass)}
              >
                <CatIcon className="h-3 w-3" />
                {catCfg.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  PRIORITY_CONFIG[tc.priority]
                )}
              >
                {tc.priority}
              </Badge>
              <Badge variant="secondary" className="text-[11px] capitalize">
                {tc.domain.replace(/-/g, " ")}
              </Badge>
            </div>
          </div>

          {/* Gherkin block */}
          <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
            <div className="flex gap-2">
              <span className="shrink-0 font-semibold text-muted-foreground">
                Given
              </span>
              <span>{tc.gherkin.given}</span>
            </div>
            <div className="mt-1.5 flex gap-2">
              <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-400">
                When
              </span>
              <span>{tc.gherkin.when}</span>
            </div>
            <div className="mt-1.5 flex gap-2">
              <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">
                Then
              </span>
              <span>{tc.gherkin.then}</span>
            </div>
          </div>

          {/* Data fields + generator link */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {tc.dataFields.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tc.dataFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={tc.generatorLink}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <LinkIcon className="h-3 w-3" />
              Generate Data
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}



