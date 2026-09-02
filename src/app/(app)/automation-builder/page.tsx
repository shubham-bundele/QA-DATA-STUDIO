'use client'

import { useState, useRef, useEffect } from 'react'
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Wand2, Code2, Loader2, Send, CheckCircle2, ChevronRight, Bug, Target, FileCode, Check, Copy, AlertCircle
} from "lucide-react"
import { toast } from "sonner"

type Step = 'STORY' | 'CLARIFY' | 'LOCATORS' | 'GENERATE'

export default function AutomationBuilderPage() {
  const [step, setStep] = useState<Step>('STORY')
  const [framework, setFramework] = useState("Playwright (TypeScript)")
  const [isGenerating, setIsGenerating] = useState(false)

  // Step 1 State
  const [story, setStory] = useState("")
  const [clarifications, setClarifications] = useState<string[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, string>>({})

  // Step 2 State
  const [outerHtml, setOuterHtml] = useState("")
  const [locators, setLocators] = useState<any[]>([])

  // Step 3 State
  const [generatedCode, setGeneratedCode] = useState<{files: {name: string, language: string, content: string}[]} | null>(null)
  const [activeFileTab, setActiveFileTab] = useState<string>("")

  const handleAnalyzeStory = async () => {
    if (!story.trim()) {
      toast.error("Please enter a user story")
      return
    }
    
    setIsGenerating(true)
    try {
      const res = await fetch('/api/automation/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story })
      })
      const data = await res.json()
      
      if (data.status === 'CLARIFY' && data.questions) {
        setClarifications(data.questions)
        setStep('CLARIFY')
      } else {
        setStep('LOCATORS')
      }
    } catch (e) {
      toast.error("Failed to analyze story")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmitClarifications = () => {
    setStep('LOCATORS')
  }

  const handleExtractLocators = async () => {
    if (!outerHtml.trim()) return
    
    setIsGenerating(true)
    try {
      const res = await fetch('/api/automation/extract-locators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: outerHtml })
      })
      const data = await res.json()
      
      if (data.locators) {
        setLocators(data.locators)
        setStep('GENERATE')
      }
    } catch (e) {
      toast.error("Failed to extract locators")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, locators, framework })
      })
      const data = await res.json()
      
      if (data.files && data.files.length > 0) {
        setGeneratedCode(data)
        setActiveFileTab(data.files[0].name)
        toast.success("Automation suite generated!")
      }
    } catch (e) {
      toast.error("Generation failed. Falling back to boilerplate.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Enterprise Automation Builder" 
        description="A guided pipeline to generate robust, resilient automation scripts using AI and DOM heuristics."
      />

      {/* Stepper UI */}
      <div className="flex items-center justify-between mb-8 px-12 relative">
        <div className="absolute left-16 right-16 top-1/2 h-[2px] bg-muted -z-10 transform -translate-y-1/2"></div>
        {[
          { id: 'STORY', label: 'Story & Clarification', icon: Wand2 },
          { id: 'LOCATORS', label: 'Locator Inspector', icon: Target },
          { id: 'GENERATE', label: 'Preview & Export', icon: FileCode }
        ].map((s, i) => {
          const isActive = step === s.id || (step === 'CLARIFY' && s.id === 'STORY')
          const isPast = ['STORY', 'CLARIFY', 'LOCATORS', 'GENERATE'].indexOf(step) > ['STORY', 'CLARIFY', 'LOCATORS', 'GENERATE'].indexOf(s.id)
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                isActive ? 'border-primary bg-primary text-primary-foreground' : 
                isPast ? 'border-green-500 bg-green-500 text-white' : 
                'border-muted bg-background text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target Framework</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Select value={framework} onValueChange={setFramework} disabled={step === 'GENERATE'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Playwright (TypeScript)">Playwright (TypeScript)</SelectItem>
                    <SelectItem value="Playwright (JavaScript)">Playwright (JavaScript)</SelectItem>
                    <SelectItem value="Playwright POM (TypeScript)">Playwright POM (TypeScript)</SelectItem>
                    <SelectItem value="Playwright BDD (Cucumber)">Playwright BDD (Cucumber)</SelectItem>
                    <SelectItem value="Playwright (Python)">Playwright (Python)</SelectItem>
                    <SelectItem value="Cypress (JavaScript)">Cypress (JavaScript)</SelectItem>
                    <SelectItem value="Selenium (Java)">Selenium (Java)</SelectItem>
                    <SelectItem value="Selenium (Python)">Selenium (Python)</SelectItem>
                    <SelectItem value="Selenium (C#)">Selenium (C#)</SelectItem>
                    <SelectItem value="Appium (Java)">Appium (Java)</SelectItem>
                    <SelectItem value="Appium (Python)">Appium (Python)</SelectItem>
                    <SelectItem value="WebDriverIO (JavaScript)">WebDriverIO (JavaScript)</SelectItem>
                    <SelectItem value="k6 Performance (JavaScript)">k6 Performance (JavaScript)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-md bg-blue-500/10 p-3 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <Code2 className="h-4 w-4 text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-400/90 leading-tight">
                    <strong>VS Code Extension Roadmap</strong><br/>
                    Future updates will allow you to run these tests locally, attach to browsers, and auto-heal DOM failures directly in your IDE.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          
          {/* STEP 1: STORY INPUT */}
          {step === 'STORY' && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>User Story Definition</CardTitle>
                <CardDescription>Paste your agile user story or acceptance criteria below. The AI will perform a deep analysis before generating code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea 
                  placeholder="e.g., As a registered user, I want to log in using my email and password so that I can access my dashboard."
                  className="w-full min-h-[200px] p-4 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  value={story}
                  onChange={e => setStory(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAnalyzeStory} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Analyze Story
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 1.5: CLARIFICATION */}
          {step === 'CLARIFY' && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-500">
                  <AlertCircle className="h-5 w-5" /> 
                  Clarification Required
                </CardTitle>
                <CardDescription>The AI needs a few more details to generate robust test scripts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {clarifications.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <Label className="text-sm font-medium">{q}</Label>
                    <Input 
                      placeholder="Your answer..." 
                      value={clarificationAnswers[i] || ''}
                      onChange={e => setClarificationAnswers({...clarificationAnswers, [i]: e.target.value})}
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep('LOCATORS')}>Skip</Button>
                  <Button onClick={handleSubmitClarifications} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Confirm Answers <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: LOCATOR INSPECTOR */}
          {step === 'LOCATORS' && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Locator Inspector & Robustness Engine</CardTitle>
                <CardDescription>Paste the outerHTML of your target component. The AI will extract and rank candidate locators based on stability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea 
                  placeholder="<form id='login'><input data-testid='email' /><button type='submit'>Login</button></form>"
                  className="w-full min-h-[200px] p-4 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  value={outerHtml}
                  onChange={e => setOuterHtml(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep('GENERATE')}>Skip (No DOM provided)</Button>
                  <Button onClick={handleExtractLocators} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                    Extract Robust Locators
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: PREVIEW & EXPORT */}
          {step === 'GENERATE' && (
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Generated Automation Suite</CardTitle>
                  <CardDescription>Review your generated POM and Test Script.</CardDescription>
                </div>
                {!generatedCode && (
                  <Button onClick={handleGenerateCode} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Code2 className="mr-2 h-4 w-4" />}
                    Generate Code
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {locators.length > 0 && !generatedCode && (
                   <div className="rounded-md border">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-muted/50 text-xs uppercase">
                         <tr>
                           <th className="px-4 py-3">Element</th>
                           <th className="px-4 py-3">Primary Selector</th>
                           <th className="px-4 py-3">Stability</th>
                         </tr>
                       </thead>
                       <tbody>
                         {locators.map((l, i) => (
                           <tr key={i} className="border-b last:border-0">
                             <td className="px-4 py-3 font-medium">{l.name}</td>
                             <td className="px-4 py-3 font-mono text-xs">{l.primary}</td>
                             <td className="px-4 py-3 text-green-500 font-bold">{l.score}/100</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                )}

                  {generatedCode && generatedCode.files && (
                    <div className="space-y-4">
                      {/* Tabs */}
                      <div className="flex space-x-2 border-b border-gray-800 pb-2 overflow-x-auto">
                        {generatedCode.files.map((file) => (
                          <button
                            key={file.name}
                            onClick={() => setActiveFileTab(file.name)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                              activeFileTab === file.name
                                ? "bg-[#1e1e1e] text-primary border-t border-x border-gray-800"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {file.name}
                          </button>
                        ))}
                      </div>

                      {/* Active File Content */}
                      {generatedCode.files.map((file) => 
                        activeFileTab === file.name && (
                          <div key={file.name} className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {file.language}
                            </Label>
                            <div className="bg-[#1e1e1e] p-4 rounded-b-md rounded-tr-md overflow-x-auto min-h-[400px] border border-gray-800">
                              <pre className="text-xs font-mono text-gray-300"><code>{file.content}</code></pre>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {generatedCode && (
                    <div className="flex justify-end mt-6">
                      <Button variant="outline" className="text-green-500 border-green-500 hover:bg-green-500/10" onClick={() => {
                        toast.success("Downloading Scaffold (Mock)")
                      }}>
                        <Check className="mr-2 h-4 w-4" />
                        Download .zip Scaffold
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
