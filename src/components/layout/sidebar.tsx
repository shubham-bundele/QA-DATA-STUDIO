"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, Database, ShieldAlert, Server } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { navSections } from "@/config/navigation"
import { useSidebarStore } from "@/stores/sidebar-store"
import { useUnsavedChangesStore } from "@/stores/unsaved-changes-store"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, toggle } = useSidebarStore()
  const { isDirty, setDirty } = useUnsavedChangesStore()
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pathname === "/") return
    if (isDirty) {
      setShowUnsavedDialog(true)
    } else {
      router.push("/")
    }
  }

  const handleConfirmLeave = () => {
    setDirty(false)
    setShowUnsavedDialog(false)
    router.push("/")
  }

  return (
    <>
      {/* Unsaved changes dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Unsaved Changes</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You have unsaved work in progress. Leaving this page will discard your current configuration and generated data.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUnsavedDialog(false)}>
                Stay on Page
              </Button>
              <Button variant="destructive" onClick={handleConfirmLeave}>
                Discard & Leave
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar-background text-sidebar-foreground will-change-[width]"
      >
        {/* Logo Section — clickable, navigates to home */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className={cn(
            "flex h-16 cursor-pointer items-center border-b border-sidebar-border px-4 transition-colors hover:bg-sidebar-accent/30",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <div className="absolute inset-0 rounded-lg bg-primary opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-60" />
            <Database className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span className="text-sm font-semibold">QA Data Studio</span>
                <span className="text-[10px] text-muted-foreground">Test Data Generator</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && "mt-6")}>
            {/* Section title */}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.h3
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {section.title}
                </motion.h3>
              )}
            </AnimatePresence>

            {/* Animated section divider when collapsed */}
            {collapsed && idx > 0 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mb-3 h-px origin-center bg-gradient-to-r from-transparent via-sidebar-border to-transparent"
              />
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  !item.disabled &&
                  (pathname === item.href || pathname.startsWith(item.href + "/"))
                const Icon = item.icon

                const linkContent = (
                  <motion.div
                    className={cn(
                      "group/item relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                      item.disabled
                        ? "cursor-not-allowed opacity-40"
                        : isActive
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70",
                      collapsed && "justify-center px-0"
                    )}
                    whileHover={item.disabled ? {} : { x: 2 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Active item gradient background */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border-l-2 border-primary"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}

                    {/* Hover background for non-active, non-disabled items */}
                    {!isActive && !item.disabled && (
                      <div className="absolute inset-0 rounded-lg bg-sidebar-accent/0 transition-colors duration-200 group-hover/item:bg-sidebar-accent/50" />
                    )}

                    {/* Left border accent on hover / active */}
                    <motion.div
                      className={cn(
                        "absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-full bg-primary",
                        collapsed && "hidden"
                      )}
                      initial={false}
                      animate={{
                        height: isActive ? 20 : 0,
                        opacity: isActive ? 1 : 0,
                      }}
                      whileHover={
                        !item.disabled && !isActive
                          ? { height: 14, opacity: 0.6 }
                          : {}
                      }
                      transition={{ duration: 0.2 }}
                    />

                    <Icon className="relative h-4 w-4 shrink-0" />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="relative"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && item.badge && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                )

                const wrappedContent = item.disabled ? (
                  <span>{linkContent}</span>
                ) : (
                  <Link href={item.href}>{linkContent}</Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.id} delayDuration={0}>
                      <TooltipTrigger asChild>{wrappedContent}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        {item.badge && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={item.id}>{wrappedContent}</div>
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className={cn("border-t border-sidebar-border p-3", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "group/collapse",
            collapsed ? "h-9 w-9" : "w-full justify-start gap-2"
          )}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronLeft className="h-4 w-4 transition-colors duration-200 group-hover/collapse:text-primary" aria-hidden="true" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
    </>
  )
}
