"use client"

import { useState } from "react"
import Link from "next/link"
import { Database, Menu, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
          >
            <div className="absolute inset-0 rounded-lg bg-primary opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-50" />
            <Database className="relative h-4 w-4 text-primary-foreground" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:text-primary">
            QA Data Studio
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2">
              Testing & AI <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 hidden w-56 pt-2 group-hover:block">
              <div className="rounded-xl border bg-background/95 backdrop-blur-md p-2 shadow-lg flex flex-col gap-1">
                {testingLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2">
              Enterprise <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 hidden w-56 pt-2 group-hover:block">
              <div className="rounded-xl border bg-background/95 backdrop-blur-md p-2 shadow-lg flex flex-col gap-1">
                {enterpriseLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:block relative">
            <div className="absolute -inset-1 rounded-xl bg-primary/20 opacity-0 blur-lg transition-opacity duration-500 hover:opacity-100" />
            <Button asChild className="relative shadow-sm shadow-primary/20 transition-shadow duration-300 hover:shadow-md hover:shadow-primary/30">
              <Link href="/dashboard">Open App</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b bg-background md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3 h-[70vh] overflow-y-auto">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 mt-2">Core Features</div>
              <Link href="/features" className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 mt-4">Testing & AI</div>
              {testingLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 mt-4">Enterprise</div>
              {enterpriseLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}

              <div className="mt-6 border-t pt-4 pb-4">
                <Button asChild className="w-full">
                  <Link href="/dashboard">Open App</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
