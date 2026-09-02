"use client"

import { Download, Code2, CheckCircle, Terminal, Zap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VSCodeExtensionPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader 
        title="VS Code Extension" 
        description="Generate automation scripts directly inside your editor using the QA Data Studio Central AI."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-500" />
              Download & Install
            </CardTitle>
            <CardDescription>Get the official QA Data Studio extension</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Our native VS Code extension acts as a bridge between your IDE and the Central AI engine. Highlight any HTML in your editor and instantly generate Playwright, Cypress, or Selenium scripts straight into your workspace.
            </p>
            
            <div className="rounded-lg bg-muted p-4 border space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                <p className="text-sm">Download the <code>.vsix</code> file below.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                <p className="text-sm">Open VS Code and go to the Extensions view (<kbd className="bg-background px-1 rounded border">Ctrl+Shift+X</kbd>).</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                <p className="text-sm">Click the <code>...</code> menu at the top right, select <strong>Install from VSIX...</strong>, and choose the downloaded file.</p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full gap-2">
              <a href="/qa-data-studio-vscode.vsix" download>
                <Download className="h-4 w-4" />
                Download qa-data-studio-vscode.vsix
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              How to Use
            </CardTitle>
            <CardDescription>Generate scripts with two clicks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-sm">Highlight HTML</h4>
                  <p className="text-sm text-muted-foreground">Open any component or web page code and highlight the elements you want to test (e.g., a login form).</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-sm">Run Command</h4>
                  <p className="text-sm text-muted-foreground">Right-click and select <strong>QA Studio: Generate Script</strong> or use the Command Palette.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-sm">Review & Run</h4>
                  <p className="text-sm text-muted-foreground">The extension will securely ask the Central AI for the code, create the files in your project, and open them instantly.</p>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-[#1e1e1e] p-3 border border-gray-800">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-2">
                <Terminal className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">Settings</span>
              </div>
              <p className="text-xs text-gray-300">
                You can configure your preferred framework (Playwright, Cypress, etc.) in VS Code Settings under <strong>QA Data Studio</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

