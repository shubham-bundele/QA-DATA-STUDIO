"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  ArrowRight,
  CreditCard,
  Globe,
  Landmark,
  Lock,
  Sparkles,
  UserCircle,
  Zap,
  Shield,
  Database,
  FileJson,
  MousePointerClick,
  Settings2,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const features = [
  {
    icon: UserCircle,
    title: "User Profile Generator",
    description: "Complete user profiles with realistic names, emails, phone numbers, and dates of birth.",
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
  },
  {
    icon: Globe,
    title: "Address Generator",
    description: "Valid street addresses, cities, states, and ZIP codes across multiple countries.",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: CreditCard,
    title: "Credit Card Generator",
    description: "Luhn-valid card numbers with correct network prefixes, CVVs, and expiry dates.",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Landmark,
    title: "Banking Data Generator",
    description: "IBAN with mod-97 check digits, SWIFT codes, routing numbers, and account data.",
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
  },
]

const stats = [
  { value: 48, suffix: "", label: "Semantic Types" },
  { value: 200, suffix: "+", label: "Boundary Values" },
  { value: 95, suffix: "", label: "Security Payloads" },
  { value: 0, suffix: "", label: "Cost", prefix: "$" },
]

const steps = [
  {
    icon: MousePointerClick,
    title: "Paste Your Schema",
    description: "Drop in JSON Schema, SQL, raw JSON, or CSV — format is auto-detected.",
  },
  {
    icon: Settings2,
    title: "Configure & Generate",
    description: "Select data categories: positive, negative, boundary, or security payloads.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Download as JSON, CSV, XML, SQL, or copy to clipboard — all client-side.",
  },
]

function AnimatedCounter({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 1500
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
      >
        {display}
      </motion.span>
      {suffix}
    </span>
  )
}

export default function HomePage() {
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const stepsRef = useRef(null)
  const ctaRef = useRef(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" })
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" })
  const stepsInView = useInView(stepsRef, { once: true, margin: "-100px" })
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" })

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-float" />
          <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[120px] animate-float animation-delay-300" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-5/8 blur-[100px] animate-float animation-delay-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%)]" />
        </div>

        <motion.div
          className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-8 gap-2 border-primary/20 px-4 py-2 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Free &amp; Open Source
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Generate Test Data{" "}
            <span className="gradient-text">That Finds Bugs</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Paste your schema. Get positive, negative, boundary, and security test data —
            instantly, privately, and entirely in your browser.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="group relative gap-2 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base hover-glow">
              <Link href="/features">Explore Features</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              No data leaves your browser
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-blue-500" />
              No registration required
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="relative border-t py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Data Generators
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              Production-grade test data with algorithmic validation — not random strings.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:gap-8"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-300 hover-lift hover-glow"
              >
                <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.color} opacity-50 blur-2xl transition-opacity group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 gap-8 lg:grid-cols-4"
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={scaleIn} className="text-center">
                <div className="text-4xl font-bold tracking-tight sm:text-5xl">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section ref={stepsRef} className="border-t py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            animate={stepsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three Steps to Test Data
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted-foreground">
              From schema to export in under 30 seconds.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 md:grid-cols-3"
            initial="hidden"
            animate={stepsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {steps.map((step, i) => (
              <motion.div key={step.title} variants={fadeInUp} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-primary/40 to-transparent md:block" />
                )}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-transform duration-300 hover:scale-110">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="mx-auto mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="border-t">
        <div className="relative overflow-hidden py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-chart-2/10 blur-[100px]" />
          </div>

          <motion.div
            className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <Lock className="h-3.5 w-3.5" />
              100% Client-Side Processing
            </motion.div>

            <motion.h2 variants={fadeInUp} className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to Streamline Your{" "}
              <span className="gradient-text">QA Workflow?</span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Start generating realistic test data right now. No sign-up required, no data leaves your browser.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-10">
              <Button asChild size="lg" className="group gap-2 px-10 py-6 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
                <Link href="/dashboard">
                  <Zap className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  Launch QA Data Studio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
