"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const faqs = [
  {
    question: "Is my generated data sent to any server?",
    answer:
      "No. QA Data Studio runs entirely in your browser. All data generation happens client-side using JavaScript. Nothing is transmitted over the network — your generated data never leaves your machine.",
  },
  {
    question: "How does the data generation work?",
    answer:
      "We use well-tested randomization algorithms seeded with cryptographically secure random values. Each generator applies domain-specific rules — for example, credit card numbers follow the Luhn algorithm, and addresses use real city/state/ZIP combinations — to produce realistic but entirely fictitious data.",
  },
  {
    question: "Is the generated credit card data real?",
    answer:
      "No. While the generated card numbers pass format validation (such as the Luhn check), they are not linked to any real account. They are designed for testing payment form UIs and validation logic in sandbox environments — never for actual transactions.",
  },
  {
    question: "Does QA Data Studio cost anything?",
    answer:
      "QA Data Studio is completely free to use. There are no paid tiers, usage limits, or hidden fees. The tool is open source and community-supported.",
  },
  {
    question: "What export formats are supported?",
    answer:
      "You can export generated data as JSON, CSV, XML, or SQL INSERT statements, or copy it directly to your clipboard.",
  },
  {
    question: "Can I generate large datasets?",
    answer:
      "Yes. You can generate hundreds or thousands of records at once. Since processing happens in your browser, performance depends on your device, but most modern machines handle large batches without any issues.",
  },
  {
    question: "Is the data suitable for production databases?",
    answer:
      "The generated data is designed for testing and development environments only. While the data is realistic in format, it is entirely fictitious and should not be used as production seed data unless you have validated it against your specific requirements.",
  },
  {
    question: "How is generation history stored?",
    answer:
      "Generation history is stored in your browser's IndexedDB. This means your history is private and persists between sessions on the same browser. Clearing your browser data will remove the history.",
  },
  {
    question: "Can I customize the generated fields?",
    answer:
      "Each generator lets you select which fields to include and configure options like quantity, format preferences, and locale. You can tailor the output to match your application's data model.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Once the application is loaded in your browser, it works entirely offline. No internet connection is required for data generation, export, or history features.",
  },
]

export default function FAQPage() {
  const faqRef = useRef(null)
  const faqInView = useInView(faqRef, { once: true, margin: "-50px" })

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-x-1/4 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-chart-5/8 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-6 gap-2 border-primary/20 px-4 py-1.5">FAQ</Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Frequently Asked Questions
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-lg text-muted-foreground">
              Everything you need to know about QA Data Studio. Can&apos;t find your answer?{" "}
              <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                Contact us
              </Link>.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section ref={faqRef} className="py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={faqInView ? "visible" : "hidden"}
            variants={stagger}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <AccordionItem value={`item-${index}`} className="border-b border-border/60 transition-colors duration-200 hover:border-primary/30">
                    <AccordionTrigger className="py-5 text-left text-base transition-colors hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
