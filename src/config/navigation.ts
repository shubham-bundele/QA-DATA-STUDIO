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
  FileText,
  Activity,
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
    title: "Intelligence & Testing",
    items: [
      {
        id: "schema",
        label: "Schema Analysis",
        href: "/schema",
        icon: BrainCircuit,
      },
      {
        id: "api-analyzer",
        label: "API Spec Analyzer",
        href: "/schema-intelligence",
        icon: FileJson,
      },
      {
        id: "test-cases",
        label: "Test Case Generator",
        href: "/test-cases",
        icon: FileText,
      },
      {
        id: "automation-builder",
        label: "Automation Builder",
        href: "/automation-builder",
        icon: FileCode, // Using FileCode instead of importing Wand2 to avoid missing import errors
      },
      {
        id: "vscode-extension",
        label: "VS Code Extension",
        href: "/vscode-extension",
        icon: FileCode,
      },
      {
        id: "chrome-extension",
        label: "Chrome Extension",
        href: "/chrome-extension",
        icon: Globe,
        badge: "New",
      },
      {
        id: "performance-tester",
        label: "Performance Tester",
        href: "/performance-tester",
        icon: Activity,
      },
      {
        id: "security-scanner",
        label: "Security Scanner",
        href: "/security-scanner",
        icon: Shield, // Using Shield
      },
      {
        id: "mock-server",
        label: "Live Mock Server",
        href: "/mock-server",
        icon: Database, // Using Database
      },
    ],
  },
  {
    title: "Enterprise",
    items: [
      {
        id: "visual-regression",
        label: "Visual Regression",
        href: "/visual-regression",
        icon: FileCode,
      },
      {
        id: "accessibility-scanner",
        label: "Accessibility Scanner",
        href: "/accessibility-scanner",
        icon: Shield,
      },
      {
        id: "self-healing",
        label: "AI Test Self-Healing",
        href: "/self-healing",
        icon: BrainCircuit,
      },
      {
        id: "contract-testing",
        label: "API Contract Testing",
        href: "/contract-testing",
        icon: FileJson,
      },
      {
        id: "ci-cd-integration",
        label: "CI/CD Webhooks",
        href: "/ci-cd-integration",
        icon: Globe,
      }
    ]
  },
  {
    title: "Generators",
    items: [
      {
        id: "database-seeder",
        label: "Direct DB Seeder",
        href: "/database-seeder",
        icon: Database,
      },
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
