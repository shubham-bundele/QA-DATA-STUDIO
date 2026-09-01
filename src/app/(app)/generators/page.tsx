import Link from "next/link"
import {
  ArrowRight,
  CreditCard,
  Database,
  FileCode,
  FileJson,
  FileSpreadsheet,
  Globe,
  Landmark,
  MapPin,
  User,
  FlaskConical,
  Shield,
  type LucideIcon,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Generators | QA Data Studio",
  description: "Browse and launch test data generators",
}

interface GeneratorItem {
  title: string
  description: string
  icon: LucideIcon
  href: string
  active: true
}

const activeGenerators: GeneratorItem[] = [
  {
    title: "User Profile",
    description:
      "Generate realistic user profiles with names, emails, phone numbers, and more.",
    icon: User,
    href: "/generators/user-profile",
    active: true,
  },
  {
    title: "Address",
    description:
      "Create valid street addresses, cities, states, ZIP codes, and coordinates.",
    icon: MapPin,
    href: "/generators/address",
    active: true,
  },
  {
    title: "Credit Card",
    description:
      "Produce valid-format card numbers with expiry dates, CVVs, and cardholder names.",
    icon: CreditCard,
    href: "/generators/credit-card",
    active: true,
  },
  {
    title: "Banking",
    description:
      "Generate bank account numbers, routing numbers, SWIFT codes, and transactions.",
    icon: Landmark,
    href: "/generators/banking",
    active: true,
  },
  {
    title: "JSON Sample",
    description:
      "Generate structured JSON documents with nested objects and arrays.",
    icon: FileJson,
    href: "/generators/json",
    active: true,
  },
  {
    title: "CSV Dataset",
    description:
      "Create tabular datasets with configurable columns and row counts.",
    icon: FileSpreadsheet,
    href: "/generators/csv",
    active: true,
  },
  {
    title: "XML",
    description:
      "Produce well-formed XML documents with custom schemas and namespaces.",
    icon: FileCode,
    href: "/generators/xml",
    active: true,
  },
  {
    title: "API Payload",
    description:
      "Build realistic REST and GraphQL request/response payloads for testing.",
    icon: Globe,
    href: "/generators/api-payload",
    active: true,
  },
  {
    title: "SQL",
    description:
      "Generate INSERT statements and seed scripts for popular database engines.",
    icon: Database,
    href: "/generators/sql",
    active: true,
  },
  {
    title: "Boundary Data",
    description:
      "Generate edge cases like MAX_INT, empty strings, and special characters.",
    icon: FlaskConical,
    href: "/generators/boundary",
    active: true,
  },
  {
    title: "Security Payloads",
    description:
      "Generate SQLi, XSS, and command injection payloads for vulnerability testing.",
    icon: Shield,
    href: "/generators/security",
    active: true,
  },
]

function ActiveCard({ generator }: { generator: GeneratorItem }) {
  return (
    <Link href={generator.href} className="group block h-full">
      <Card className="h-full transition-all duration-300 hover:border-primary/40 hover-lift hover-glow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <generator.icon className="h-5 w-5" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
          <CardTitle className="mt-3 text-base">{generator.title}</CardTitle>
          <CardDescription className="leading-relaxed">
            {generator.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export default function GeneratorsPage() {
  return (
    <div className="space-y-8 flex-1 p-4 md:p-8 pt-6">
      <PageHeader
        title="Data Generators"
        description="Browse and launch test data generators. Pick a generator to start creating realistic, structured data for your QA workflows."
      />

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeGenerators.map((generator) => (
            <ActiveCard key={generator.title} generator={generator} />
          ))}
        </div>
      </section>
    </div>
  )
}
