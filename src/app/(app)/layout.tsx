"use client"

import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/stores/sidebar-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { collapsed } = useSidebarStore()

  return (
    <div className="relative min-h-screen">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileSidebar />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <Topbar />
        <main id="main-content" className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
