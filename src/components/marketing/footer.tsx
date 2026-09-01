"use client"

import Link from "next/link"
import { Database } from "lucide-react"
import { motion } from "framer-motion"

const testingLinks = [
  { href: "/automation-builder", label: "Automation Builder" },
  { href: "/performance-tester", label: "Performance Tester" },
  { href: "/security-scanner", label: "Security Scanner" },
  { href: "/mock-server", label: "Live Mock Server" },
  { href: "/test-cases", label: "Test Case Generator" },
  { href: "/schema", label: "Schema Analysis" },
  { href: "/schema-intelligence", label: "API Spec Analyzer" },
]

const enterpriseLinks = [
  { href: "/visual-regression", label: "Visual Regression" },
  { href: "/accessibility-scanner", label: "Accessibility Scanner" },
  { href: "/self-healing", label: "AI Test Self-Healing" },
  { href: "/contract-testing", label: "API Contract Testing" },
  { href: "/ci-cd-integration", label: "CI/CD Webhooks" },
  { href: "/database-seeder", label: "Direct DB Seeder" },
]

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
]

const developerLinks = [
  { href: "/faq", label: "Getting Started" },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

function FooterLinkSection({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-3 space-y-2.5"
      >
        {links.map((link) => (
          <motion.li key={link.href + link.label} variants={itemVariants}>
            <Link
              href={link.href}
              className="group/flink inline-flex items-center text-sm text-muted-foreground transition-all duration-200 hover:text-foreground"
            >
              <span className="transition-transform duration-200 group-hover/flink:translate-x-1">
                {link.label}
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}

export function MarketingFooter() {
  return (
    <footer className="relative bg-muted/30">
      {/* Gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                {/* Glow */}
                <div className="absolute inset-0 rounded-lg bg-primary opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-50" />
                <Database className="relative h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:text-primary">
                QA Data Studio
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Generate realistic test data for QA Engineers. Fast, private, and completely
              client-side.
            </p>
          </div>

          {/* Testing & AI */}
          <FooterLinkSection title="Testing & AI" links={testingLinks} />

          {/* Enterprise */}
          <FooterLinkSection title="Enterprise" links={enterpriseLinks} />

          {/* Company */}
          <FooterLinkSection title="Company" links={companyLinks} />
        </div>

        {/* Bottom Bar */}
        <div className="relative mt-12 pt-6">
          {/* Subtle gradient divider */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} QA Data Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
