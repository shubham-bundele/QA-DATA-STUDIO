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

interface ComingSoonItem {
  title: string
  description: string
  icon: LucideIcon
  active: false
}

type GeneratorCardData = GeneratorItem | ComingSoonItem

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
]

const comingSoonGenerators: ComingSoonItem[] = [
  {
    title: "JSON Sample",
    description:
      "Generate structured JSON documents with nested objects and arrays.",
    icon: FileJson,
    active: false,
  },
  {
    title: "CSV Dataset",
    description:
      "Create tabular datasets with configurable columns and row counts.",
    icon: FileSpreadsheet,
    active: false,
  },
  {
    title: "XML",
    description:
      "Produce well-formed XML documents with custom schemas and namespaces.",
    icon: FileCode,
    active: false,
  },
  {
    title: "API Payload",
    description:
      "Build realistic REST and GraphQL request/response payloads for testing.",
    icon: Globe,
    active: false,
  },
  {
    title: "SQL",
    description:
      "Generate INSERT statements and seed scripts for popular database engines.",
    icon: Database,
    active: false,
  },
]

function ActiveCard({ generator }: { generator: GeneratorItem }) {
  return (
    <Link href={generator.href} className="group block">
      <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-md">
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

function ComingSoonCard({ generator }: { generator: ComingSoonItem }) {
  return (
    <Card className="h-full opacity-60">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <generator.icon className="h-5 w-5" />
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <CardTitle className="mt-3 text-base">{generator.title}</CardTitle>
        <CardDescription className="leading-relaxed">
          {generator.description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export default function GeneratorsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Data Generators"
        description="Browse and launch test data generators. Pick a generator to start creating realistic, structured data for your QA workflows."
      />

      {/* Active Generators */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Available Generators
          </h3>
          <Badge variant="default" className="text-[11px]">
            {activeGenerators.length}
          </Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeGenerators.map((generator) => (
            <ActiveCard key={generator.title} generator={generator} />
          ))}
        </div>
      </section>

      {/* Coming Soon Generators */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Coming Soon
          </h3>
          <Badge variant="outline" className="text-[11px]">
            {comingSoonGenerators.length}
          </Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoonGenerators.map((generator) => (
            <ComingSoonCard key={generator.title} generator={generator} />
          ))}
        </div>
      </section>
    </div>
  )
}
