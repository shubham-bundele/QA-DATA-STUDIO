"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Globe,
  History,
  Landmark,
  Shield,
  Shuffle,
  UserCircle,
  BrainCircuit,
  Activity,
  FileCode,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

const generators = [
  {
    icon: BrainCircuit,
    title: "AI Automation Builder",
    badge: "QA AI",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    capabilities: [
      "Natural language to Playwright/Cypress",
      "Auto-generated Page Object Models",
      "Cross-browser assertions",
      "Smart DOM locator inference",
      "Direct code execution in CI",
      "Zero-config setup",
    ],
  },
  {
    icon: Activity,
    title: "Performance Tester",
    badge: "Load Testing",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
    capabilities: [
      "Import Browser HAR & Postman",
      "A/B Performance Regression overlays",
      "Datadog / Prometheus APM integration",
      "Advanced Chaos Engineering modes",
      "Real-time live WebSocket charts",
      "Export advanced k6 CI scripts",
    ],
  },
  {
    icon: Shield,
    title: "Security Scanner",
    badge: "SecOps",
    gradient: "from-red-500/20 to-rose-500/20",
    iconColor: "text-red-500",
    capabilities: [
      "Automated XSS & SQLi payload injection",
      "AI Threat Mitigation & code patches",
      "Directory traversal checks",
      "Generates injection arrays",
      "Live terminal streaming",
      "Detailed vulnerability reports",
    ],
  },
  {
    icon: Database,
    title: "Live Mock Server",
    badge: "Dev Tools",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
    iconColor: "text-purple-500",
    capabilities: [
      "AI Mock Architect (Auto-generation)",
      "Stateful CRUD simulation",
      "Configurable network latency",
      "Custom status code handling",
      "One-click deploy to live endpoints",
      "Persisted mock database",
    ],
  },
  {
    icon: FileJson,
    title: "API Spec Analyzer",
    badge: "QA AI",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-500",
    capabilities: [
      "Upload OpenAPI/Swagger specs",
      "Auto-generates boundary limits",
      "Generates security payloads",
      "Direct API execution engine",
      "Load test (k6) export support",
      "Auto-detects query parameters",
    ],
  },
  {
    icon: FileText,
    title: "Test Case Generator",
    badge: "QA AI",
    gradient: "from-indigo-500/20 to-blue-500/20",
    iconColor: "text-indigo-500",
    capabilities: [
      "Convert Jira User Stories into tests",
      "BDD (Given/When/Then) syntax",
      "Positive and negative edge cases",
      "Push tickets directly to Jira",
      "Real-time validation criteria",
      "Persisted generation history",
    ],
  },
  {
    icon: CheckCircle2,
    title: "Visual Regression",
    badge: "UI/UX",
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-500",
    capabilities: [
      "Pixel-perfect DOM snapshot diffing",
      "Highlight layout shifts",
      "Cross-environment baseline comparison",
      "Ignore dynamic content regions",
      "Mobile responsive testing",
      "Accessibility contrast checks",
    ],
  },
  {
    icon: BrainCircuit,
    title: "AI Test Self-Healing",
    badge: "Enterprise",
    gradient: "from-teal-500/20 to-cyan-500/20",
    iconColor: "text-teal-500",
    capabilities: [
      "Automatically fixes broken locators",
      "Analyzes DOM changes over time",
      "Heals Playwright & Cypress scripts",
      "Maintains semantic intent",
      "One-click patch application",
      "Reduces pipeline flakiness",
    ],
  },
  {
    icon: FileCode,
    title: "API Contract Testing",
    badge: "Integration",
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-500",
    capabilities: [
      "Pact-compatible contract generation",
      "Consumer-Driven Contract (CDC) checks",
      "Schema drift detection",
      "Type safety enforcement",
      "CI/CD breaking change alerts",
      "Mock server integration",
    ],
  },
  {
    icon: Shield,
    title: "Accessibility Scanner",
    badge: "Compliance",
    gradient: "from-indigo-500/20 to-violet-500/20",
    iconColor: "text-indigo-500",
    capabilities: [
      "WCAG 2.1 AA/AAA compliance checks",
      "Axe-core powered engine",
      "Auto-heals ARIA attributes",
      "Screen reader compatibility tests",
      "Color contrast validation",
      "Detailed compliance reports",
    ],
  },
  {
    icon: Globe,
    title: "CI/CD Webhooks",
    badge: "DevOps",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-500",
    capabilities: [
      "Trigger tests on GitHub push",
      "Slack/Teams failure notifications",
      "Jira ticket auto-creation",
      "Configurable webhook payloads",
      "Pipeline blocking on failure",
      "Execution history tracking",
    ],
  },
  {
    icon: Database,
    title: "Direct DB Seeder",
    badge: "Data",
    gradient: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
    capabilities: [
      "Direct PostgreSQL connection",
      "AI-generated relational data",
      "Maintains foreign key constraints",
      "Wipes/truncates tables safely",
      "Preview SQL before execution",
      "Fast bulk inserts",
    ],
  },
  {
    icon: BrainCircuit,
    title: "Schema Analysis",
    badge: "QA AI",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-500",
    capabilities: [
      "Analyze SQL schemas via AI",
      "Generate test strategies",
      "Detect missing indexes",
      "Suggest edge cases",
      "ERD generation hints",
      "Security audit for schemas",
    ],
  },
]

const exportFormats = [
  {
    icon: FileJson,
    title: "JSON",
    description: "Structured JSON output with nested objects. Ideal for REST API testing and JavaScript applications.",
  },
  {
    icon: FileSpreadsheet,
    title: "CSV",
    description: "Comma-separated values for spreadsheets, database imports, and data pipeline testing.",
  },
  {
    icon: FileText,
    title: "XML",
    description: "Well-formed XML with configurable root and row elements. Perfect for SOAP services and legacy integrations.",
  },
  {
    icon: Database,
    title: "SQL INSERT",
    description: "Ready-to-run INSERT statements with configurable table names and column mappings.",
  },
  {
    icon: Download,
    title: "Clipboard",
    description: "One-click copy to clipboard in any format. Paste directly into your IDE or test harness.",
  },
]

const qualityFeatures = [
  {
    icon: Shield,
    title: "Data Validation",
    description:
      "Every generated record passes format validation. Credit card numbers use the Luhn algorithm, emails follow RFC standards, and phone numbers match regional patterns.",
  },
  {
    icon: Shuffle,
    title: "Randomization Controls",
    description:
      "Fine-tune the randomness of your data. Set seed values for reproducible datasets or let the generators create fully random outputs each time.",
  },
  {
    icon: History,
    title: "Generation History",
    description:
      "Every generation is saved to your local history. Revisit, re-download, or regenerate previous datasets without starting from scratch.",
  },
]

export default function FeaturesPage() {
  const genRef = useRef(null)
  const exportRef = useRef(null)
  const qualityRef = useRef(null)
  const genInView = useInView(genRef, { once: true, margin: "-80px" })
  const exportInView = useInView(exportRef, { once: true, margin: "-80px" })
  const qualityInView = useInView(qualityRef, { once: true, margin: "-80px" })

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-chart-2/8 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-6 gap-2 border-primary/20 px-4 py-1.5">Features</Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Everything You Need for{" "}
              <span className="gradient-text">Test Data</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-lg text-muted-foreground">
              A comprehensive suite of nine powerful QA automation tools, multiple export formats, and DB streaming — all
              running seamlessly in your browser.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Generators */}
      <section ref={genRef} className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            animate={genInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Data Generators
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Each generator produces realistic, validated data tailored for QA and testing scenarios.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 lg:grid-cols-2"
            initial="hidden"
            animate={genInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {generators.map((gen) => (
              <motion.div
                key={gen.title}
                variants={scaleIn}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-300 hover-lift hover-glow"
              >
                <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${gen.gradient} opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80`} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gen.gradient} ${gen.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                      <gen.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">{gen.badge}</Badge>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{gen.title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {gen.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Export Formats */}
      <section ref={exportRef} className="border-t bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            animate={exportInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Export Formats
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Download or copy your generated data in the format that fits your workflow.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate={exportInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {exportFormats.map((fmt) => (
              <motion.div
                key={fmt.title}
                variants={scaleIn}
                className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover-lift hover-glow"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <fmt.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{fmt.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {fmt.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Data Quality */}
      <section ref={qualityRef} className="border-t py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            animate={qualityInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Data Quality &amp; Controls
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Built-in validation and controls to ensure your test data is exactly what you need.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-10 lg:grid-cols-3"
            initial="hidden"
            animate={qualityInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {qualityFeatures.map((feat) => (
              <motion.div key={feat.title} variants={fadeInUp} className="group text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                  <feat.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feat.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
