"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BarChart3,
  Database,
  Layers,
  FileJson,
  User,
  MapPin,
  CreditCard,
  Landmark,
  Clock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getTotals } from "@/client/repositories/analytics.repository"
import { getAllHistory } from "@/client/repositories/history.repository"
import type { AnalyticsCounter } from "@/client/models/analytics.model"
import type { HistoryEntry } from "@/client/models/history-entry.model"

const quickActions = [
  {
    title: "User Profile",
    description: "Generate realistic user profiles with names, emails, and more",
    href: "/generators/user-profile",
    icon: User,
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Address",
    description: "Create valid street addresses, cities, and postal codes",
    href: "/generators/address",
    icon: MapPin,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Credit Card",
    description: "Generate test credit card numbers with valid formats",
    href: "/generators/credit-card",
    icon: CreditCard,
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Banking",
    description: "Create bank accounts, routing numbers, and SWIFT codes",
    href: "/generators/banking",
    icon: Landmark,
    gradient: "from-sky-500/20 to-blue-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsCounter | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    getTotals().then(setAnalytics).catch(() => {})
    getAllHistory(5).then(setHistory).catch(() => {})
  }, [])

  const stats = [
    {
      title: "Total Generations",
      value: String(analytics?.totalGenerations ?? 0),
      icon: BarChart3,
      description: "All-time generation runs",
    },
    {
      title: "Records Generated",
      value: String(analytics?.totalRecords ?? 0),
      icon: Database,
      description: "Total data records created",
    },
    {
      title: "Total Exports",
      value: String(analytics?.totalExports ?? 0),
      icon: Layers,
      description: "Files exported",
    },
    {
      title: "Default Format",
      value: (typeof window !== "undefined" ? localStorage.getItem("qa-export-format") : null)?.toUpperCase() || "JSON",
      icon: FileJson,
      description: "Preferred export format",
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your test data generation activity"
      />

      {/* Stat Cards with staggered entrance */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="relative overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Actions with hover-lift */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="mb-4 text-lg font-semibold tracking-tight">
          Quick Actions
        </h3>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.href}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <Card className="group relative cursor-pointer overflow-hidden border-transparent shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                    <CardHeader>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {action.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Recent History with animated items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="mb-4 text-lg font-semibold tracking-tight">
          Recent History
        </h3>
        <Card>
          <CardContent className={history.length === 0 ? "p-0" : "p-4"}>
            {history.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No generation history yet"
                description="Your recent data generation activity will appear here. Start by using one of the generators above."
              />
            ) : (
              <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {history.map((entry) => (
                  <motion.div
                    key={entry.id}
                    variants={itemVariants}
                    whileHover={{
                      scale: 1.01,
                      backgroundColor: "hsl(var(--muted) / 0.5)",
                      transition: { duration: 0.2 },
                    }}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{entry.generatorType.replace("-", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.recordCount} records &middot; {new Date(entry.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
