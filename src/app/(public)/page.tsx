"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  ArrowRight,
  Lock,
  Sparkles,
  Zap,
  Shield,
  Database,
  FileJson,
  ClipboardList,
  Activity,
  BrainCircuit,
  FileCode,
  CheckCircle2,
  Eye,
  Webhook,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const tools = [
  { icon: BrainCircuit,  title: "AI Automation Builder",  href: "/automation-builder",    badge: "QA AI",        color: "from-blue-500/20 to-cyan-500/20",      ic: "text-blue-400",    bg: "bg-blue-500/10" },
  { icon: Activity,      title: "Performance Tester",     href: "/performance-tester",    badge: "Load Testing", color: "from-green-500/20 to-emerald-500/20",   ic: "text-green-400",   bg: "bg-green-500/10" },
  { icon: Shield,        title: "Security Scanner",       href: "/security-scanner",      badge: "SecOps",       color: "from-red-500/20 to-rose-500/20",        ic: "text-red-400",     bg: "bg-red-500/10" },
  { icon: Database,      title: "Live Mock Server",       href: "/mock-server",           badge: "Dev Tools",    color: "from-purple-500/20 to-fuchsia-500/20",  ic: "text-purple-400",  bg: "bg-purple-500/10" },
  { icon: CheckCircle2,  title: "Visual Regression",      href: "/visual-regression",     badge: "UI/UX",        color: "from-amber-500/20 to-yellow-500/20",    ic: "text-amber-400",   bg: "bg-amber-500/10" },
  { icon: Eye,           title: "Accessibility Scanner",  href: "/accessibility-scanner", badge: "Compliance",   color: "from-indigo-500/20 to-violet-500/20",   ic: "text-indigo-400",  bg: "bg-indigo-500/10" },
  { icon: BrainCircuit,  title: "AI Test Self-Healing",   href: "/self-healing",          badge: "Enterprise",   color: "from-teal-500/20 to-cyan-500/20",       ic: "text-teal-400",    bg: "bg-teal-500/10" },
  { icon: FileCode,      title: "API Contract Testing",   href: "/contract-testing",      badge: "Integration",  color: "from-orange-500/20 to-red-500/20",      ic: "text-orange-400",  bg: "bg-orange-500/10" },
  { icon: Webhook,       title: "CI/CD Webhooks",         href: "/ci-cd-integration",     badge: "DevOps",       color: "from-sky-500/20 to-blue-500/20",        ic: "text-sky-400",     bg: "bg-sky-500/10" },
  { icon: ClipboardList, title: "Test Case Generator",    href: "/test-cases",            badge: "QA AI",        color: "from-fuchsia-500/20 to-purple-500/20",  ic: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  { icon: FileJson,      title: "API Spec Analyzer",      href: "/schema-intelligence",   badge: "QA AI",        color: "from-pink-500/20 to-rose-500/20",       ic: "text-pink-400",    bg: "bg-pink-500/10" },
  { icon: BrainCircuit,  title: "Schema Analysis",        href: "/schema",                badge: "QA AI",        color: "from-violet-500/20 to-purple-500/20",   ic: "text-violet-400",  bg: "bg-violet-500/10" },
  { icon: Sparkles,      title: "Data Generators",        href: "/generators",            badge: "Generate",     color: "from-yellow-500/20 to-amber-500/20",    ic: "text-yellow-400",  bg: "bg-yellow-500/10" },
  { icon: Database,      title: "Direct DB Seeder",       href: "/database-seeder",       badge: "Data",         color: "from-emerald-500/20 to-green-500/20",   ic: "text-emerald-400", bg: "bg-emerald-500/10" },
]

const stats = [
  { value: 14,  suffix: "+", label: "Integrated Tools" },
  { value: 200, suffix: "+", label: "Boundary Values" },
  { value: 95,  suffix: "+", label: "Security Payloads" },
  { value: 0,   suffix: "",  label: "Cost to Use", prefix: "$" },
]

const steps = [
  { step: "01", title: "Paste Your Schema",    desc: "Drop in JSON Schema, SQL, raw JSON, or CSV. Format is auto-detected instantly." },
  { step: "02", title: "Configure & Generate", desc: "Select data categories — positive, negative, boundary, or security payloads." },
  { step: "03", title: "Export Anywhere",      desc: "Download as JSON, CSV, XML, SQL, or copy to clipboard. Fully client-side." },
]

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1500, start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, value])
  return <span ref={ref} className="tabular-nums">{prefix}{display}{suffix}</span>
}

export default function HomePage() {
  const toolsRef = useRef(null)
  const statsRef = useRef(null)
  const ctaRef   = useRef(null)
  const toolsInView = useInView(toolsRef, { once: true, margin: "-80px" })
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" })
  const ctaInView   = useInView(ctaRef,   { once: true, margin: "-80px" })

  return (
    <div className="flex flex-col overflow-x-hidden">

      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-[560px] w-[560px] rounded-full bg-primary/[0.08] blur-[130px] animate-float" />
          <div className="absolute right-1/4 bottom-1/4 h-[420px] w-[420px] rounded-full bg-chart-2/[0.08] blur-[130px] animate-float animation-delay-300" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.05] blur-[100px] animate-float animation-delay-700" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,hsl(var(--background))_80%)]" />
        </div>

        <motion.div className="mx-auto max-w-4xl text-center" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Enterprise QA Platform — Free &amp; Open Source
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-[5.25rem] lg:leading-[1.06]">
            The Complete{" "}
            <span className="gradient-text">AI-Powered</span>
            <br />QA Studio
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Generate test data, run load tests with SSO/2FA, scan for vulnerabilities, mock APIs, and automate your entire QA pipeline in one platform.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="group gap-2 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/35">
              <Link href="/dashboard">
                <Zap className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Launch Studio
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-8 text-base backdrop-blur-sm hover-glow">
              <Link href="/features">
                Explore Features
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-500" />No data leaves your browser</span>
            <span className="hidden sm:block h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-blue-500" />Zero registration required</span>
            <span className="hidden sm:block h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" />14+ integrated tools</span>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS STRIP */}
      <section ref={statsRef} className="border-y bg-muted/15">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div className="grid grid-cols-2 gap-6 md:grid-cols-4" initial="hidden" animate={statsInView ? "visible" : "hidden"} variants={stagger}>
            {stats.map((s) => (
              <motion.div key={s.label} variants={scaleIn} className="flex flex-col items-center text-center">
                <div className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="mt-1.5 text-sm font-medium text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TOOLS GRID */}
      <section ref={toolsRef} className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-2xl text-center" initial="hidden" animate={toolsInView ? "visible" : "hidden"} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">The Full Toolkit</motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              One Studio.{" "}<span className="gradient-text">All Your QA Tools.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              From AI test generation to live load testing with SSO/2FA — every tool your team needs, production-ready.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            initial="hidden" animate={toolsInView ? "visible" : "hidden"} variants={stagger}
          >
            {tools.map((tool) => (
              <motion.div key={tool.title} variants={scaleIn}>
                <Link href={tool.href} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
                  <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tool.color} opacity-40 blur-xl transition-opacity duration-300 group-hover:opacity-90`} />
                  <div className="relative flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.bg} ${tool.ic} transition-transform duration-300 group-hover:scale-110`}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tool.bg} ${tool.ic} border border-current/20`}>{tool.badge}</span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">{tool.title}</h3>
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary">
                      Open tool <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              See detailed feature breakdown <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t bg-muted/10 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Workflow</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Up &amp; Running in 3 Steps</h2>
            <p className="mt-3 text-muted-foreground">From zero to test data in under 30 seconds.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="relative flex flex-col rounded-2xl border border-border/50 bg-card/40 p-6 text-center backdrop-blur-sm">
                {i < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-primary/30 to-transparent md:block" />
                )}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl font-black text-primary">{step}</div>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="border-t">
        <div className="relative overflow-hidden py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/3 top-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/3 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[100px]" />
          </div>
          <motion.div className="mx-auto max-w-2xl px-4 text-center" initial="hidden" animate={ctaInView ? "visible" : "hidden"} variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <Lock className="h-3.5 w-3.5" />
              100% client-side — your data never leaves your browser
            </motion.div>
            <motion.h2 variants={fadeUp} className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to upgrade your{" "}
              <span className="gradient-text">QA workflow?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground">
              No sign-up. No credit card. Just open the studio and ship better software.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="group gap-2 px-10 py-6 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/35">
                <Link href="/dashboard">
                  <Zap className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  Launch QA Studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                <Link href="/features">Explore all features</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
