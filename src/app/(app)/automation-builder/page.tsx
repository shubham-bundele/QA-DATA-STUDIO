"use client"

import { useState } from "react"
import { Code2, Wand2, Loader2, Copy, CheckCircle, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function AutomationBuilderPage() {
  const [prompt, setPrompt] = useState("Go to https://qa-data-studio.app. Click the 'Sign In' button. Fill the 'Email' input with test@example.com and 'Password' with SecurePass123. Click submit. Verify the text 'Welcome back' appears.")
  const [framework, setFramework] = useState("Playwright (TypeScript)")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!prompt) return
    setIsGenerating(true)
    setGeneratedCode("")
    
    try {
      const res = await fetch('/api/build-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework })
      })

      if (!res.body) throw new Error("No response")
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        
        // Strip markdown backticks if AI leaks them
        let cleanChunk = chunk.replace(/```(javascript|typescript|python|java)?/gi, '').replace(/```/g, '')
        setGeneratedCode(prev => prev + cleanChunk)
      }
    } catch (e) {
      setGeneratedCode("// Error generating script. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
     let ext = "ts";
     if (framework.includes("Python")) ext = "py";
     if (framework.includes("Java")) ext = "java";
     if (framework.includes("Cypress") || framework.includes("JavaScript")) ext = "js";
     
     const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8;" })
     const url = URL.createObjectURL(blob)
     const link = document.createElement("a")
     link.href = url
     link.download = `test-script.${ext}`
     link.click()
     URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="AI Automation Builder" 
        description="Describe a user journey in plain English, and instantly get production-ready E2E automation code." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" /> Journey Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target Framework</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Playwright (TypeScript)">Playwright (TypeScript)</SelectItem>
                    <SelectItem value="Cypress (JavaScript)">Cypress (JavaScript)</SelectItem>
                    <SelectItem value="Selenium (Python)">Selenium (Python)</SelectItem>
                    <SelectItem value="Selenium (Java)">Selenium (Java)</SelectItem>
                    <SelectItem value="Puppeteer (Node.js)">Puppeteer (Node.js)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plain English Test Steps</Label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Go to https://example.com. Click the 'Sign In' button. Fill the 'Email' input with test@test.com and 'Password' with 123456. Click submit. Verify the text 'Welcome back' appears."
                  className="mt-1 flex min-h-[250px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button onClick={handleGenerate} disabled={!prompt || isGenerating} className="w-full gap-2">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
                {isGenerating ? "Writing Code..." : "Generate Script"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 h-[600px] flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-lg">
            <CardHeader className="bg-muted/30 border-b py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Generated {framework.split(' ')[0]} Code
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy} disabled={!generatedCode}>
                   {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload} disabled={!generatedCode}>
                   <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden bg-[#1e1e1e]">
              {generatedCode ? (
                <pre className="p-4 text-sm font-mono text-[#d4d4d4] overflow-auto h-full">
                  <code>{generatedCode}</code>
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Wand2 className="h-12 w-12 mb-4 opacity-20" />
                  <p>Describe your test to generate code</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

