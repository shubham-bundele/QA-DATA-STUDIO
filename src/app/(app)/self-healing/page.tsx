"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Wand2, Copy, CheckCircle2 } from "lucide-react"

export default function SelfHealingPage() {
  const [script, setScript] = useState("await page.locator('#old-login-btn').click();")
  const [htmlContext, setHtmlContext] = useState('<button data-testid="new-login-btn" class="btn-primary">Sign In</button>')
  const [errorMessage, setErrorMessage] = useState("Timeout: locator('#old-login-btn') not found")
  
  const [isHealing, setIsHealing] = useState(false)
  const [healedScript, setHealedScript] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleHeal = async () => {
    if (!script || !htmlContext) return
    setIsHealing(true)
    setError("")
    setHealedScript("")

    try {
      const res = await fetch('/api/heal-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, htmlContext, errorMessage })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to heal script")
      setHealedScript(data.healedScript)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsHealing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(healedScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="AI Test Self-Healing" 
        description="Fix broken Playwright/Cypress tests automatically by providing the new DOM context." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>The Broken Script</CardTitle>
              <CardDescription>Paste the test code that is currently failing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Original Script</Label>
                <textarea 
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="mt-1 font-mono h-40 flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                  placeholder="await page.locator('#old-login-btn').click();"
                />
              </div>
              <div>
                <Label>Error Message (Optional)</Label>
                <Input 
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="Timeout: locator('#old-login-btn') not found"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New DOM Context</CardTitle>
              <CardDescription>Paste the HTML snippet of the updated page where the element now lives.</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea 
                value={htmlContext}
                onChange={(e) => setHtmlContext(e.target.value)}
                className="mt-1 font-mono h-40 flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                placeholder={'<button data-testid="new-login-btn" class="btn-primary">Sign In</button>'}
              />
            </CardContent>
          </Card>

          <Button onClick={handleHeal} disabled={isHealing || !script || !htmlContext} className="w-full h-12 text-lg shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            {isHealing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
            Heal Script
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              {error}
            </div>
          )}
        </div>

        <div>
          <Card className="h-full border-primary/20 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Healed Script Output</CardTitle>
                  <CardDescription>AI-corrected locators ready to use.</CardDescription>
                </div>
                {healedScript && (
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-zinc-950 text-zinc-50">
              {!healedScript && !isHealing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                  <Wand2 className="h-12 w-12 mb-4 opacity-20" />
                  <p>Provide the script and context, then click Heal Script to generate updated locators.</p>
                </div>
              )}
              {isHealing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Analyzing DOM diffs and healing locators...</p>
                </div>
              )}
              {healedScript && !isHealing && (
                <pre className="p-6 font-mono text-sm overflow-auto w-full h-full text-green-400">
                  {healedScript}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

