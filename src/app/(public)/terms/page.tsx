import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Terms of Service",
}

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using QA Data Studio ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use the Service. We reserve the right to modify these terms at any time, and your continued use of the Service constitutes acceptance of any changes.`,
  },
  {
    title: "2. Description of Service",
    content: `QA Data Studio is a browser-based tool that generates fictitious test data for software testing and quality assurance purposes. The Service provides generators for user profiles, addresses, credit card numbers, and banking data, with support for multiple export formats.

The Service runs entirely in the user's browser. No data is processed on or transmitted to our servers during the generation process.`,
  },
  {
    title: "3. Acceptable Use",
    content: `You agree to use QA Data Studio only for lawful purposes. Specifically, you agree not to:

- Use generated data for fraudulent activities or financial crimes
- Attempt to use generated credit card numbers for real transactions
- Use the Service to generate data intended to deceive or harm others
- Misrepresent generated data as real personal information
- Use the Service in any way that violates applicable laws or regulations

Generated data is intended solely for testing, development, and quality assurance purposes.`,
  },
  {
    title: "4. Intellectual Property",
    content: `QA Data Studio is open-source software. The source code is available under its respective license, which governs your rights to use, modify, and distribute the software. The QA Data Studio name, logo, and branding are proprietary and may not be used without permission.`,
  },
  {
    title: "5. Disclaimer of Warranties",
    content: `QA Data Studio is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components. We make no guarantees regarding the accuracy, completeness, or reliability of any generated data.

You acknowledge that generated data is fictitious and may not perfectly represent real-world data patterns in all cases.`,
  },
  {
    title: "6. Limitation of Liability",
    content: `To the fullest extent permitted by law, QA Data Studio and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. This includes, but is not limited to, damages for loss of data, revenue, or business opportunities.

Our total liability for any claim arising from these terms or your use of the Service shall not exceed the amount you paid for the Service (which is zero, as the Service is free).`,
  },
  {
    title: "7. Data and Privacy",
    content: `Your use of QA Data Studio is also governed by our Privacy Policy. By using the Service, you acknowledge that all data generation occurs locally in your browser and that we do not collect or store your generated data.`,
  },
  {
    title: "8. Modifications to the Service",
    content: `We reserve the right to modify, suspend, or discontinue any part of the Service at any time without prior notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.`,
  },
  {
    title: "9. Governing Law",
    content: `These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising under these terms shall be resolved in the appropriate courts of the applicable jurisdiction.`,
  },
  {
    title: "10. Contact",
    content: `If you have any questions about these Terms of Service, please contact us at hello@qadatastudio.com.`,
  },
]

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">Legal</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
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
            Please read these Terms of Service carefully before using QA Data Studio. By using the
            Service, you agree to be bound by these terms.
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
