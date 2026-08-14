import {
  LayoutDashboard,
  User,
  MapPin,
  CreditCard,
  Landmark,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Globe,
  Database,
  Shield,
  FlaskConical,
  ClipboardList,
  Settings,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  disabled?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        id: "schema",
        label: "Schema Intelligence",
        href: "/schema",
        icon: BrainCircuit,
      },
      {
        id: "test-cases",
        label: "Test Case Generator",
        href: "/test-cases",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "Generators",
    items: [
      {
        id: "user-profile",
        label: "User Profile",
        href: "/generators/user-profile",
        icon: User,
      },
      {
        id: "address",
        label: "Address",
        href: "/generators/address",
        icon: MapPin,
      },
      {
        id: "credit-card",
        label: "Credit Card",
        href: "/generators/credit-card",
        icon: CreditCard,
      },
      {
        id: "banking",
        label: "Banking",
        href: "/generators/banking",
        icon: Landmark,
      },
      {
        id: "json",
        label: "JSON Sample",
        href: "/generators/json",
        icon: FileJson,
      },
      {
        id: "csv",
        label: "CSV Dataset",
        href: "/generators/csv",
        icon: FileSpreadsheet,
      },
      {
        id: "xml",
        label: "XML",
        href: "/generators/xml",
        icon: FileCode,
      },
      {
        id: "api-payload",
        label: "API Payload",
        href: "/generators/api-payload",
        icon: Globe,
      },
      {
        id: "sql",
        label: "SQL",
        href: "/generators/sql",
        icon: Database,
      },
      {
        id: "boundary",
        label: "Boundary Data",
        href: "/generators/boundary",
        icon: FlaskConical,
      },
      {
        id: "security",
        label: "Security Payloads",
        href: "/generators/security",
        icon: Shield,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]
