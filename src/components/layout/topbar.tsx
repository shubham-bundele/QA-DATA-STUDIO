"use client"

import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/stores/sidebar-store"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { navSections } from "@/config/navigation"

function getPageTitle(pathname: string): string {
  for (const section of navSections) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label
      }
    }
  }
  return "QA Data Studio"
}

export function Topbar() {
  const { collapsed, setMobileOpen } = useSidebarStore()
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 sm:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      style={{ transition: "padding-left 300ms cubic-bezier(0.4,0,0.2,1)" }}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title with slide-in animation on route change */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.h1
            key={pathname}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="text-lg font-semibold tracking-tight truncate"
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
