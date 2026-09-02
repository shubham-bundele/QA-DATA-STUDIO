"use client"

import { useState } from "react"
import { GitBranch, Download, Copy, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CiCdIntegrationPage() {
  const [copied, setCopied] = useState(false)

  const githubActionYaml = `name: QA Data Studio - Automated Tests

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  run-qa-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Run Load & Security Scans
        run: |
          echo "Triggering Headless QA Data Studio Run..."
          curl -X POST https://your-qa-data-studio.app/api/webhook/execute \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.QA_STUDIO_TOKEN }}" \\
            -d '{"project": "default", "runLoadTest": true, "runSecurityScan": true}'

      - name: Notify Slack on Failure
        if: failure()
        run: echo "Tests Failed! Check logs."
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(githubActionYaml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="CI/CD Integration" 
        description="Trigger performance and security tests automatically when code is pushed to your repository." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" /> Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
               <p><strong>1. Generate Token:</strong> Go to Settings and generate a headless execution token.</p>
               <p><strong>2. Add to Secrets:</strong> In your GitHub repository, go to Settings &gt; Secrets and Variables &gt; Actions. Add a new secret named <code>QA_STUDIO_TOKEN</code>.</p>
               <p><strong>3. Commit Workflow:</strong> Create a file in your repository at <code>.github/workflows/qa-tests.yml</code> and paste the generated configuration.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col border-primary/20 shadow-lg">
            <CardHeader className="bg-muted/30 border-b py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">.github/workflows/qa-tests.yml</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                   {copied ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                   {copied ? "Copied" : "Copy YAML"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden bg-[#1e1e1e]">
               <pre className="p-4 text-sm font-mono text-[#d4d4d4] overflow-auto h-full">
                  <code>{githubActionYaml}</code>
               </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

