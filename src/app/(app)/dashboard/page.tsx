"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  ShieldAlert,
  ServerCrash,
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Zap,
  Bug,
  Eye,
  GitBranch,
  Database,
  Clock,
  Brain,
  RefreshCw,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts"
import { useOrchestratorStore } from "@/stores/orchestrator-store"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  // â”€â”€ AI QA Orchestrator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { lastReport, isRunning, hasEscalation, setReport, setRunning } =
    useOrchestratorStore()
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null)

  /**
   * Fires the orchestrator endpoint and stores the returned report.
   * Called by the "Run Now" button in the AI Orchestrator card.
   */
  const runOrchestration = async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredBy: "dashboard" }),
      })
      const data = await res.json()
      setReport(data)
      setAiStatusMsg(
        data.overallStatus === "PASS"
          ? "All checks passed âœ…"
          : data.overallStatus === "PARTIAL"
          ? "Some checks need attention âš ï¸"
          : data.overallStatus === "FAIL" || data.overallStatus === "AI_FAILED"
          ? "Critical failures detected âŒ"
          : `Status: ${data.overallStatus ?? "unknown"}`
      )
    } catch (err) {
      setAiStatusMsg("Orchestration request failed â€” check the server logs.")
    } finally {
      setRunning(false)
    }
  }

  /**
   * On mount: restore the last known orchestration state from the /status
   * endpoint so the card is populated even after a page refresh.
   */
  useEffect(() => {
    fetch("/api/orchestrator/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.runId) setReport(data)
      })
      .catch(() => {/* silently ignore â€” store already has persisted state */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  // â”€â”€ KPI Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const kpis = [
    {
      title: "Test Pass Rate",
      value: "94.2%",
      trend: "+2.1% vs last week",
      trendUp: true,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      bar: "bg-emerald-500",
      barWidth: "w-[94%]",
    },
    {
      title: "Security Vulnerabilities",
      value: "3",
      trend: "+1 new (7d) Â· 2 critical",
      trendUp: true,
      icon: ShieldAlert,
      color: "text-red-500",
      bg: "bg-red-500/10",
      bar: "bg-red-500",
      barWidth: "w-[15%]",
    },
    {
      title: "Avg API Latency (P99)",
      value: "142ms",
      trend: "-12% improvement (30d)",
      trendUp: false,
      icon: Timer,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      bar: "bg-blue-500",
      barWidth: "w-[48%]",
    },
    {
      title: "A11y Violations",
      value: "7",
      trend: "WCAG AA Â· 2 critical",
      trendUp: true,
      icon: Eye,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      bar: "bg-amber-500",
      barWidth: "w-[30%]",
    },
    {
      title: "CI/CD Pipeline Health",
      value: "4/5",
      trend: "1 degraded Â· 4 healthy",
      trendUp: false,
      icon: GitBranch,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      bar: "bg-purple-500",
      barWidth: "w-[80%]",
    },
    {
      title: "Failed API Endpoints",
      value: "0.2%",
      trend: "-0.5% in 24h",
      trendUp: false,
      icon: ServerCrash,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      bar: "bg-teal-500",
      barWidth: "w-[2%]",
    },
    {
      title: "Mock Endpoint Requests",
      value: "18.4k",
      trend: "+34% today",
      trendUp: true,
      icon: Database,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      bar: "bg-indigo-500",
      barWidth: "w-[70%]",
    },
    {
      title: "Avg Test Gen Time",
      value: "3.2s",
      trend: "AI generation speed",
      trendUp: false,
      icon: Clock,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      bar: "bg-pink-500",
      barWidth: "w-[32%]",
    },
  ]

  // â”€â”€ Chart Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const testTrendData = [
    { day: "Mon", passed: 186, failed: 8, flaky: 6 },
    { day: "Tue", passed: 205, failed: 12, flaky: 4 },
    { day: "Wed", passed: 237, failed: 6, flaky: 3 },
    { day: "Thu", passed: 218, failed: 9, flaky: 7 },
    { day: "Fri", passed: 245, failed: 4, flaky: 2 },
    { day: "Sat", passed: 198, failed: 3, flaky: 1 },
    { day: "Sun", passed: 231, failed: 5, flaky: 3 },
  ]

  const latencyData = [
    { time: "00:00", p50: 80,  p95: 120, p99: 150 },
    { time: "04:00", p50: 72,  p95: 108, p99: 135 },
    { time: "08:00", p50: 95,  p95: 145, p99: 180 },
    { time: "12:00", p50: 110, p95: 162, p99: 200 },
    { time: "16:00", p50: 98,  p95: 148, p99: 188 },
    { time: "20:00", p50: 85,  p95: 128, p99: 160 },
    { time: "24:00", p50: 76,  p95: 115, p99: 142 },
  ]

  const securityData = [
    { name: "Critical", value: 2, color: "#ef4444" },
    { name: "High",     value: 4, color: "#f97316" },
    { name: "Medium",   value: 9, color: "#eab308" },
    { name: "Low",      value: 18, color: "#3b82f6" },
    { name: "Info",     value: 31, color: "#8b5cf6" },
  ]

  const coverageRadarData = [
    { subject: "Unit",        score: 88 },
    { subject: "Integration", score: 72 },
    { subject: "E2E",         score: 65 },
    { subject: "Performance", score: 80 },
    { subject: "Security",    score: 55 },
    { subject: "A11y",        score: 60 },
  ]

  const suiteData = [
    { name: "Frontend E2E",   passed: 45, failed: 2, flaky: 5 },
    { name: "API Contract",   passed: 120, failed: 0, flaky: 1 },
    { name: "Performance",    passed: 10, failed: 1, flaky: 0 },
    { name: "Security Scan",  passed: 30, failed: 3, flaky: 0 },
    { name: "A11y Checks",    passed: 22, failed: 4, flaky: 2 },
    { name: "Visual Diff",    passed: 18, failed: 1, flaky: 3 },
  ]

  const throughputData = [
    { time: "Mon", requests: 4200, errors: 84 },
    { time: "Tue", requests: 5800, errors: 116 },
    { time: "Wed", requests: 4900, errors: 49 },
    { time: "Thu", requests: 6200, errors: 62 },
    { time: "Fri", requests: 7100, errors: 71 },
    { time: "Sat", requests: 3800, errors: 38 },
    { time: "Sun", requests: 4400, errors: 44 },
  ]

  const recentActivity = [
    { tool: "Security Scanner",      status: "critical", msg: "2 new SQL injection vectors found",      time: "3m ago",  icon: ShieldAlert },
    { tool: "Performance Tester",    status: "ok",       msg: "Load test completed Â· P99 142ms",        time: "18m ago", icon: Activity },
    { tool: "AI Automation Builder", status: "ok",       msg: "12 Playwright scripts generated",        time: "32m ago", icon: Zap },
    { tool: "Accessibility Scanner", status: "warning",  msg: "7 WCAG AA violations detected",          time: "1h ago",  icon: Eye },
    { tool: "Test Case Generator",   status: "ok",       msg: "48 BDD test cases created from story",   time: "2h ago",  icon: CheckCircle2 },
    { tool: "Visual Regression",     status: "warning",  msg: "3 layout shifts detected on /checkout",  time: "3h ago",  icon: Bug },
    { tool: "API Contract Testing",  status: "ok",       msg: "All 14 consumer contracts passed",       time: "4h ago",  icon: GitBranch },
    { tool: "CI/CD Webhooks",        status: "critical", msg: "Pipeline #412 failed Â· deploy blocked",  time: "5h ago",  icon: XCircle },
  ]

  const TOOLTIP_STYLE = {
    contentStyle: { backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" },
    itemStyle: { color: "#e4e4e7" },
    labelStyle: { color: "#a1a1aa" },
  }

  return (
    <div className="space-y-6 p-4 md:p-6 flex-1">
      <PageHeader
        title="Enterprise Dashboard"
        description="Real-time QA health across all testing tools, security posture, and automation pipelines."
      />

      {/* â”€â”€ KPI GRID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.title} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-md group">
                <div className={`absolute inset-x-0 top-0 h-0.5 ${kpi.bar}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{kpi.title}</CardTitle>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${kpi.bg} shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
                  <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${kpi.bar} ${kpi.barWidth} transition-all duration-700`} />
                  </div>
                  <p className={`mt-1.5 text-[11px] font-medium flex items-center gap-1 ${kpi.trendUp ? "text-red-500" : "text-emerald-500"}`}>
                    {kpi.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* â”€â”€ AI QA ORCHESTRATOR CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card className="border-violet-500/30 bg-violet-500/5">
        {/* â”€â”€ Card Header â”€â”€ */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                <Brain className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">AI QA Orchestrator</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Centralized AI-powered quality gate â€” runs security, performance, accessibility &amp; contract checks
                </CardDescription>
              </div>
            </div>

            {/* â”€â”€ Overall Status Badge â”€â”€ */}
            <div className="flex items-center gap-3">
              {lastReport && (
                <Badge
                  variant="outline"
                  className={
                    lastReport.overallStatus === "PASS"
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                      : lastReport.overallStatus === "PARTIAL"
                      ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                      : "border-red-500/50 text-red-400 bg-red-500/10"
                  }
                >
                  {lastReport.overallStatus ?? "UNKNOWN"}
                </Badge>
              )}

              {/* â”€â”€ Run Now Button â”€â”€ */}
              <button
                onClick={runOrchestration}
                disabled={isRunning}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
                {isRunning ? "Runningâ€¦" : "Run Now"}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* â”€â”€ Escalation Banner â”€â”€ */}
          {hasEscalation && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <p className="text-xs font-medium text-red-300 leading-snug">
                âš ï¸ AI Escalation Required: Human review needed. The Gemini Multimodal AI system detected critical failures.
              </p>
            </div>
          )}

          {/* â”€â”€ Status Message (transient feedback after a run) â”€â”€ */}
          {aiStatusMsg && (
            <p className="text-xs text-muted-foreground">{aiStatusMsg}</p>
          )}

          {/* â”€â”€ No-report Empty State â”€â”€ */}
          {!lastReport && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Brain className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No orchestration run yet.</p>
              <p className="text-xs text-muted-foreground/70">
                Click <span className="font-semibold text-violet-400">'Run Now'</span> to trigger the AI QA system.
              </p>
            </div>
          )}

          {/* â”€â”€ Checks Table â”€â”€ */}
          {lastReport?.checks && lastReport.checks.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Check</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {lastReport.checks.map((check: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{check.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            check.status === "PASS"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]"
                              : check.status === "PARTIAL"
                              ? "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"
                              : "border-red-500/40 text-red-400 bg-red-500/10 text-[10px]"
                          }
                        >
                          {check.status ?? "â€”"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {check.durationMs != null ? `${check.durationMs}ms` : "â€”"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* â”€â”€ Last Run Timestamp â”€â”€ */}
          {lastReport?.timestamp && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last run: {new Date(lastReport.timestamp).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* â”€â”€ ROW 1: Test Trend + Latency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Test Pass/Fail Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">Test Execution Trend (7d)</CardTitle>
                <CardDescription className="text-xs mt-0.5">Daily pass, fail, and flaky counts across all suites</CardDescription>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Pass</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />Fail</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-500" />Flaky</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={testTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gPassed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="passed" stroke="#10b981" fill="url(#gPassed)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#gFailed)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="flaky" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* P50 / P95 / P99 Latency */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">API Latency Percentiles (24h)</CardTitle>
                <CardDescription className="text-xs mt-0.5">P50, P95 and P99 response times across load test endpoints</CardDescription>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-400" />P50</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-500" />P95</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />P99</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
                    <RechartsTooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}ms`]} />
                    <Line type="monotone" dataKey="p50" stroke="#60a5fa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p95" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ ROW 2: Suite Matrix + Security Pie + Coverage Radar â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Test Suite Matrix */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suite Health Matrix</CardTitle>
            <CardDescription className="text-xs mt-0.5">Pass / Fail / Flaky across all suites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={suiteData} layout="vertical" margin={{ top: 0, right: 8, left: 60, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={58} />
                    <RechartsTooltip {...TOOLTIP_STYLE} cursor={{ fill: "#27272a" }} />
                    <Bar dataKey="passed" stackId="a" fill="#10b981" />
                    <Bar dataKey="flaky"  stackId="a" fill="#f59e0b" />
                    <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Donut */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vulnerability Distribution</CardTitle>
            <CardDescription className="text-xs mt-0.5">Security scan findings by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={securityData} cx="50%" cy="45%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                      {securityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coverage Radar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">QA Coverage Radar</CardTitle>
            <CardDescription className="text-xs mt-0.5">Coverage score per testing discipline (0-100)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={coverageRadarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#71717a" }} />
                    <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                    <RechartsTooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Coverage"]} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ ROW 3: Throughput + Activity Feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Weekly Throughput */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">Mock Server Throughput (7d)</CardTitle>
                <CardDescription className="text-xs mt-0.5">Total requests vs error rate on the Live Mock Server</CardDescription>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />Requests</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />Errors</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={throughputData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#gReq)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="errors"   stroke="#ef4444" fill="url(#gErr)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs mt-0.5">Latest events across all QA tools</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentActivity.map((item, i) => {
                const Icon = item.icon
                const statusColor =
                  item.status === "critical" ? "text-red-500 bg-red-500/10" :
                  item.status === "warning"  ? "text-amber-500 bg-amber-500/10" :
                  "text-emerald-500 bg-emerald-500/10"
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${statusColor}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.tool}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{item.msg}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{item.time}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ VISUAL STATUS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overall QA Health Score</CardTitle>
          <CardDescription className="text-xs mt-0.5">Composite score across all testing dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Test Automation",    score: 94, color: "bg-emerald-500" },
              { label: "Security Posture",   score: 67, color: "bg-amber-500" },
              { label: "Performance SLA",    score: 88, color: "bg-blue-500" },
              { label: "A11y Compliance",    score: 58, color: "bg-orange-500" },
              { label: "API Reliability",    score: 99, color: "bg-teal-500" },
              { label: "Visual Consistency", score: 82, color: "bg-violet-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className={`font-bold ${item.score >= 90 ? "text-emerald-500" : item.score >= 70 ? "text-amber-500" : "text-red-500"}`}>
                    {item.score}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
