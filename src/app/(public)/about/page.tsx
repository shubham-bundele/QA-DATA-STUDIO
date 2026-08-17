"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { CheckCircle2, Eye, Heart, Shield, Target, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const values = [
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data never leaves your browser. We built QA Data Studio to be 100% client-side because we believe test data generation should not require trusting a third party.",
    gradient: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: Zap,
    title: "Speed Matters",
    description:
      "QA workflows are time-sensitive. Every interaction in QA Data Studio is optimized for speed — instant generation, one-click export, and zero loading screens.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "QA Data Studio is open source. You can inspect every algorithm, audit every line of code, and contribute improvements. No black boxes, no hidden logic.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Heart,
    title: "Community Driven",
    description:
      "Built by QA engineers, for QA engineers. Feature requests, bug reports, and contributions from the community shape the direction of the product.",
    gradient: "from-rose-500/20 to-pink-500/20",
    iconColor: "text-rose-500",
  },
]

const differentiators = [
  "No account required — open the app and start generating",
  "Zero network requests during data generation",
  "Works entirely in the browser after initial load",
  "Export to JSON, CSV, XML, SQL, or copy to clipboard",
  "Full generation history stored locally",
  "Open source with an active community",
]

export default function AboutPage() {
  const missionRef = useRef(null)
  const valuesRef = useRef(null)
  const diffRef = useRef(null)
  const missionInView = useInView(missionRef, { once: true, margin: "-80px" })
  const valuesInView = useInView(valuesRef, { once: true, margin: "-80px" })
  const diffInView = useInView(diffRef, { once: true, margin: "-80px" })

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-1/4 top-0 h-[500px] w-[500px] -translate-y-1/3 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-chart-2/8 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-6 gap-2 border-primary/20 px-4 py-1.5">About</Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Built for{" "}
              <span className="gradient-text">QA Engineers</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-lg text-muted-foreground">
              QA Data Studio exists because generating test data should be fast, private, and free.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section ref={missionRef} className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl"
            initial="hidden"
            animate={missionInView ? "visible" : "hidden"}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our Mission</h2>
            </motion.div>
            <motion.div variants={fadeInUp} className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                Every QA engineer has spent hours crafting test data by hand — copying sample
                records, tweaking fields to avoid duplicates, and formatting data for different
                systems. It is tedious, error-prone, and takes time away from what actually matters:
                finding bugs and ensuring software quality.
              </p>
              <p>
                QA Data Studio was created to eliminate that friction. We provide purpose-built
                generators that produce realistic, validated test data in seconds. Whether you need
                a hundred user profiles for a registration flow test or a batch of banking
                transactions for a fintech integration, QA Data Studio gets you there faster.
              </p>
              <p>
                We chose to make the tool entirely client-side because sensitive test environments
                should not depend on external services. Your data stays on your machine, period.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section ref={valuesRef} className="border-t bg-muted/20 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={stagger}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
              What We Believe
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              The principles that guide every decision we make.
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-2"
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={stagger}
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={fadeInUp}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover-lift hover-glow"
              >
                <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${value.gradient} opacity-40 blur-2xl transition-opacity group-hover:opacity-80`} />
                <div className="relative flex gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${value.gradient} ${value.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                    <value.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section ref={diffRef} className="border-t py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl"
            initial="hidden"
            animate={diffInView ? "visible" : "hidden"}
            variants={stagger}
          >
            <motion.h2 variants={fadeInUp} className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              What Makes QA Data Studio Different
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
              We are not another generic data faker. QA Data Studio is purpose-built for testing
              workflows.
            </motion.p>

            <motion.ul
              className="mt-12 space-y-4"
              initial="hidden"
              animate={diffInView ? "visible" : "hidden"}
              variants={stagger}
            >
              {differentiators.map((item) => (
                <motion.li
                  key={item}
                  variants={fadeInUp}
                  className="group flex items-start gap-3 rounded-xl border border-transparent bg-muted/30 px-5 py-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
