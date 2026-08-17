import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Privacy Policy",
}

const sections = [
  {
    title: "1. Information We Collect",
    content: `QA Data Studio is a client-side application. We do not collect, store, or transmit any personal data you enter or generate within the tool. All data generation happens entirely in your browser.

When you visit our website, our hosting provider may automatically collect standard web server logs, including your IP address, browser type, referring page, and timestamps. These logs are used solely for infrastructure monitoring and are not linked to any individual identity.`,
  },
  {
    title: "2. How We Use Information",
    content: `Any information collected through standard web server logs is used exclusively for:

- Maintaining and monitoring the performance of our website
- Identifying and resolving technical issues
- Analyzing aggregate traffic patterns to improve the service

We do not use this information for advertising, profiling, or any purpose beyond operating and improving QA Data Studio.`,
  },
  {
    title: "3. Data Storage",
    content: `QA Data Studio stores your generation history and preferences in your browser's local storage. This data remains on your device and is never transmitted to our servers. You can clear this data at any time by clearing your browser's local storage or using the in-app controls.

We do not use server-side databases to store any user-generated content.`,
  },
  {
    title: "4. Cookies and Tracking",
    content: `QA Data Studio does not use tracking cookies, analytics services, or third-party advertising pixels. We may use essential cookies required for basic website functionality, such as remembering your theme preference.`,
  },
  {
    title: "5. Third-Party Services",
    content: `QA Data Studio does not share any data with third-party services. The application runs entirely in your browser without making external API calls during data generation. Our website may be served through a content delivery network (CDN) for performance, which processes requests according to its own privacy policy.`,
  },
  {
    title: "6. Data Security",
    content: `Since QA Data Studio processes all data locally in your browser, your generated test data is inherently private. We use HTTPS to encrypt all communication between your browser and our web server. We follow industry best practices to secure our infrastructure.`,
  },
  {
    title: "7. Children's Privacy",
    content: `QA Data Studio is not directed at children under the age of 13. We do not knowingly collect personal information from children.`,
  },
  {
    title: "8. Changes to This Policy",
    content: `We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Your continued use of QA Data Studio after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    title: "9. Contact Us",
    content: `If you have questions or concerns about this privacy policy, please contact us at hello@qadatastudio.com.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">Legal</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Last updated: January 1, 2024
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-base leading-relaxed text-muted-foreground">
            At QA Data Studio, your privacy is fundamental to how we build our product. This
            policy explains what information we collect, how we use it, and your rights regarding
            your data.
          </p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
