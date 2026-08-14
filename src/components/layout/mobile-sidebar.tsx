"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { navSections } from "@/config/navigation"
import { useSidebarStore } from "@/stores/sidebar-store"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function MobileSidebar() {
  const pathname = usePathname()
  const { mobileOpen, setMobileOpen } = useSidebarStore()

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Database className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold">QA Data Studio</span>
                <span className="text-[10px] font-normal text-muted-foreground">Test Data Generator</span>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="px-3 py-4">
          {navSections.map((section, idx) => (
            <div key={section.title} className={cn(idx > 0 && "mt-6")}>
              <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = !item.disabled && (pathname === item.href || pathname.startsWith(item.href + "/"))
                  const Icon = item.icon

                  const classes = cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    item.disabled
                      ? "cursor-not-allowed opacity-40"
                      : isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )

                  const inner = (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )

                  if (item.disabled) {
                    return <span key={item.id} className={classes}>{inner}</span>
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={classes}
                    >
                      {inner}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
