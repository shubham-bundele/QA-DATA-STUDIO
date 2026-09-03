"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { 
  Database, Menu, X, ChevronDown, BrainCircuit, Activity, Shield, 
  ClipboardList, FileJson, CheckCircle2, Eye, FileCode, Webhook
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Features", href: "/features" },
  { 
    label: "Testing Tools", 
    children: [
      { href: "/automation-builder", label: "Automation Builder", desc: "Build E2E tests visually via AI", icon: BrainCircuit },
      { href: "/performance-tester", label: "Performance Tester", desc: "Run load tests with SSO/2FA", icon: Activity },
      { href: "/security-scanner", label: "Security Scanner", desc: "SAST & DAST vulnerability scans", icon: Shield },
      { href: "/mock-server", label: "Live Mock Server", desc: "Mock APIs instantly without backend", icon: Database },
      { href: "/test-cases", label: "Test Cases", desc: "Generate edge-case test suites", icon: ClipboardList },
      { href: "/schema-intelligence", label: "API Spec Analyzer", desc: "Analyze OpenAPI & Swagger specs", icon: FileJson },
    ],
    width: "w-[600px]",
    cols: "grid-cols-2"
  },
  { 
    label: "Enterprise", 
    children: [
      { href: "/visual-regression", label: "Visual Regression", desc: "Pixel-perfect diff comparisons", icon: CheckCircle2 },
      { href: "/accessibility-scanner", label: "A11y Scanner", desc: "WCAG 2.1 AA compliance checks", icon: Eye },
      { href: "/self-healing", label: "AI Self-Healing", desc: "Auto-fix flaky locators & scripts", icon: BrainCircuit },
      { href: "/contract-testing", label: "Contract Testing", desc: "Schema validation & drift detection", icon: FileCode },
      { href: "/ci-cd-integration", label: "CI/CD Webhooks", desc: "Trigger via GitHub, GitLab, Jenkins", icon: Webhook },
    ],
    width: "w-[350px]",
    cols: "grid-cols-1"
  }
]

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Hover & Mega Menu State
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (label: string) => {
    if (timeoutId) clearTimeout(timeoutId)
    setActiveTab(label)
  }
  
  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setActiveTab(null)
    }, 150) // Slight delay to make moving to dropdown easier
    setTimeoutId(id)
  }

  // Scroll State for Floating Hide/Show
  const { scrollYProgress } = useScroll()
  const [visible, setVisible] = useState(true)

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - scrollYProgress.getPrevious()!
      if (scrollYProgress.get() < 0.05) {
        setVisible(true)
      } else {
        if (direction < 0) {
          setVisible(true)
        } else {
          setVisible(false)
        }
      }
    }
  })

  // Find active children data for the Bento Box
  const activeNavItem = NAV_ITEMS.find(item => item.label === activeTab)
  const hasMegaMenu = activeNavItem && activeNavItem.children

  return (
    <AnimatePresence mode="wait">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-4 left-0 right-0 z-50 mx-auto w-full max-w-5xl px-4"
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative flex h-14 items-center justify-between rounded-full border border-border/50 bg-background/70 px-6 backdrop-blur-xl shadow-lg shadow-black/10 dark:shadow-black/40">
          
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-primary"
            >
              <div className="absolute inset-0 rounded-lg bg-primary opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-60" />
              <Database className="relative h-3.5 w-3.5 text-primary-foreground" />
            </motion.div>
            <span className="text-base font-bold tracking-tight transition-colors duration-200 group-hover:text-primary hidden sm:block">
              QA Data Studio
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden items-center md:flex relative">
            {NAV_ITEMS.map((item) => (
              <div 
                key={item.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.label)}
              >
                {/* Glowing Pill Hover Background */}
                {activeTab === item.label && (
                  <motion.div
                    layoutId="pill"
                    className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {item.href ? (
                  <Link href={item.href} className="relative block px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                ) : (
                  <button className="relative flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                    {item.label} 
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-transform duration-300", 
                      activeTab === item.label ? "rotate-180" : ""
                    )} />
                  </button>
                )}
              </div>
            ))}

            {/* Fluid Mega Menu Dropdown */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 pointer-events-none">
              <AnimatePresence mode="wait">
                {hasMegaMenu && (
                  <motion.div
                    key="mega-menu"
                    layoutId="mega-menu-container"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn(
                      "pointer-events-auto overflow-hidden rounded-3xl border border-border/50 bg-background/80 p-2 backdrop-blur-3xl shadow-2xl",
                      activeNavItem.width
                    )}
                    onMouseEnter={() => handleMouseEnter(activeTab!)} // Keep open while hovering panel
                  >
                    <motion.div 
                      key={activeNavItem.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className={cn("grid gap-1", activeNavItem.cols)}
                    >
                      {activeNavItem.children?.map((child) => (
                        <Link 
                          key={child.href} 
                          href={child.href} 
                          className="group flex items-start gap-3 rounded-2xl p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <child.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{child.label}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{child.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden md:flex rounded-full px-5 shadow-sm shadow-primary/20 transition-all hover:shadow-md hover:shadow-primary/30">
              <Link href="/dashboard">Open App</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Minimal Mobile Menu (Static height animation) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden rounded-3xl mt-2 border border-border/50 bg-background/95 backdrop-blur-xl shadow-lg"
            >
              <div className="p-4 flex flex-col gap-2">
                <Link href="/features" className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted/50">Features</Link>
                <Link href="/dashboard" className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted/50 text-primary">Open App</Link>
                <p className="px-4 pt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Testing Tools</p>
                {NAV_ITEMS[1].children?.map(c => (
                  <Link key={c.href} href={c.href} className="rounded-xl px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 pl-6">{c.label}</Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </AnimatePresence>
  )
}
