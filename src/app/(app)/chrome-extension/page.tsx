"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Puzzle, CheckCircle2, Bot, ScanLine, Code2 } from "lucide-react"

export default function ChromeExtensionPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Chrome Extension" 
        description="Bring QA Data Studio's AI directly into your browser."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2">
                <Puzzle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>QA Data Studio AI</CardTitle>
                <CardDescription>Manifest V3 Browser Extension</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Supercharge your testing workflow by integrating QA Data Studio directly into Google Chrome. 
                Record tests, scan for accessibility issues, generate AI bug reports, and fill forms intelligently on any website.
              </p>
              
              <ul className="space-y-3">
                {[
                  "Smart Form Filler: Generate realistic test data and inject it into forms.",
                  "Locator Inspector: Get robust XPath, CSS, and Playwright locators on hover.",
                  "AI Test Recorder: Record clicks and typing into plain English user stories.",
                  "A11y Scanner: Instantly scan localhost or auth-protected pages for WCAG issues.",
                  "Visual Bug Reporter: Draw a box over a UI bug and let AI draft the ticket.",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <a href="/qa-data-studio-extension.zip" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Extension (.zip)
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation Guide</CardTitle>
            <CardDescription>How to install the unpacked extension in Chrome</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="ml-4 list-decimal space-y-4 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Download the .zip file</strong>
                <p>Click the download button on this page to get the extension package.</p>
              </li>
              <li>
                <strong className="text-foreground">Extract the folder</strong>
                <p>Unzip the downloaded file to a permanent location on your computer.</p>
              </li>
              <li>
                <strong className="text-foreground">Open Chrome Extensions</strong>
                <p>Navigate to <code>chrome://extensions/</code> in your Google Chrome browser.</p>
              </li>
              <li>
                <strong className="text-foreground">Enable Developer Mode</strong>
                <p>Toggle the "Developer mode" switch in the top right corner.</p>
              </li>
              <li>
                <strong className="text-foreground">Load Unpacked</strong>
                <p>Click the "Load unpacked" button and select the folder you extracted in Step 2.</p>
              </li>
              <li>
                <strong className="text-foreground">Pin the Extension</strong>
                <p>Click the puzzle piece icon in Chrome and pin QA Data Studio AI for easy access!</p>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

