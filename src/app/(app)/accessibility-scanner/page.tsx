"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, ScanFace, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EyeOff } from "lucide-react"

export default function AccessibilityScannerPage() {
  const [url, setUrl] = useState("https://example.com")
  const [wcagLevel, setWcagLevel] = useState("wcag2aa")
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")
  
  const [isReportView, setIsReportView] = useState(false)
  const [healingNode, setHealingNode] = useState<string | null>(null)
  const [healedHtml, setHealedHtml] = useState<Record<string, string>>({})

  const [simType, setSimType] = useState("achromatopsia")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simImage, setSimImage] = useState("")
  const [simError, setSimError] = useState("")

  const [fgColor, setFgColor] = useState("#000000")
  const [bgColor, setBgColor] = useState("#FFFFFF")

  const [images, setImages] = useState<any[]>([])
  const [isExtractingImages, setIsExtractingImages] = useState(false)
  const [altTextGenerations, setAltTextGenerations] = useState<Record<string, string>>({})
  const [generatingAltText, setGeneratingAltText] = useState<Record<string, boolean>>({})

  const getLuminance = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255
    let g = parseInt(hex.slice(3, 5), 16) / 255
    let b = parseInt(hex.slice(5, 7), 16) / 255
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const getContrastRatio = (fg: string, bg: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(fg) || !/^#[0-9A-F]{6}$/i.test(bg)) return 1
    const l1 = getLuminance(fg)
    const l2 = getLuminance(bg)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const contrastRatio = getContrastRatio(fgColor, bgColor)

  useEffect(() => {
    // Check if we were redirected from the Chrome Extension
    if (typeof window !== 'undefined' && window.location.search.includes('fromExtension=true')) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'A11Y_SCAN_RESULTS') {
          setResults(event.data.payload)
          const urlToSet = event.data.payload.targetUrl || event.data.payload.url;
          if (urlToSet && urlToSet !== 'about:blank') {
            setUrl(urlToSet)
          } else {
            setUrl("Scanned from Chrome Extension")
          }
          // Do NOT set isReportView=true, because we want the interactive detailed view with AI healing
          window.removeEventListener('message', handleMessage)
        }
      }
      window.addEventListener('message', handleMessage)

      // Give the content script (bridge.js) a moment to inject, then ask for the data
      setTimeout(() => {
        window.postMessage({ type: 'A11Y_REQUEST_DATA' }, '*')
      }, 500)

      return () => window.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleScan = async () => {
    if (!url) return
    setIsScanning(true)
    setError("")
    setResults(null)
    setHealedHtml({})

    try {
      const res = await fetch('/api/run-a11y-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, wcagLevel })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to scan")
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsScanning(false)
    }
  }

  const handleSimulate = async () => {
    if (!url) return
    setIsSimulating(true)
    setSimError("")
    setSimImage("")

    try {
      const res = await fetch('/api/vision-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: simType })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to simulate")
      setSimImage(data.image)
    } catch (err: any) {
      setSimError(err.message)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleExtractImages = async () => {
    if (!url) return
    setIsExtractingImages(true)
    setImages([])
    setError("")
    
    try {
      const res = await fetch('/api/extract-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to extract images")
      setImages(data.images)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsExtractingImages(false)
    }
  }

  const handleGenerateAltText = async (imageUrl: string) => {
    setGeneratingAltText(prev => ({ ...prev, [imageUrl]: true }))
    try {
      const res = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })
      const data = await res.json()
      if (res.ok && data.altText) {
        setAltTextGenerations(prev => ({ ...prev, [imageUrl]: data.altText }))
      } else {
        throw new Error(data.error || "Failed")
      }
    } catch (err: any) {
      alert("AI Alt Text Generation failed: " + err.message)
    } finally {
      setGeneratingAltText(prev => ({ ...prev, [imageUrl]: false }))
    }
  }

  const handleExportJSON = () => {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `a11y-scan-${Date.now()}.json`
    link.click()
  }

  const handleExportCSV = () => {
    if (!results || !results.violations) return
    const headers = ["Violation ID", "Impact", "Description", "Help URL", "Failing HTML"]
    const rows = results.violations.flatMap((v: any) => 
      v.nodes.map((node: any) => [v.id, v.impact, `"${v.description}"`, v.helpUrl, `"${node.html.replace(/"/g, '""')}"`])
    )
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `a11y-scan-${Date.now()}.csv`
    link.click()
  }

  const handleAiFix = async (html: string, violationId: string, description: string, nodeKey: string) => {
    setHealingNode(nodeKey)
    try {
      const res = await fetch('/api/heal-a11y', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, violationId, description })
      })
      const data = await res.json()
      if (res.ok && data.healedHtml) {
        setHealedHtml(prev => ({ ...prev, [nodeKey]: data.healedHtml }))
      }
    } catch (err) {
      alert("AI Fix failed.")
    } finally {
      setHealingNode(null)
    }
  }

  if (isReportView && results) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 print:p-0 print:bg-white print:text-black">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Button variant="ghost" onClick={() => setIsReportView(false)} className="gap-2">
            Back to Scanner
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            Print / Save PDF
          </Button>
        </div>

        <div className="bg-card text-card-foreground p-8 md:p-12 rounded-2xl border shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
          <div className="border-b pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 print:text-black">Accessibility Audit Report</h1>
              <p className="text-muted-foreground print:text-gray-600">Generated on {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary print:text-black">Target URL</p>
              <p className="text-sm text-muted-foreground print:text-gray-500">{url}</p>
              <p className="text-sm text-muted-foreground print:text-gray-500">WCAG Level: {wcagLevel.toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 border rounded-xl bg-background/50 text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Violations</p>
              <p className="text-3xl font-bold text-red-500">{results.violations?.length || 0}</p>
            </div>
            <div className="p-4 border rounded-xl bg-background/50 text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Needs Review</p>
              <p className="text-3xl font-bold text-amber-500">{results.incomplete?.length || 0}</p>
            </div>
            <div className="p-4 border rounded-xl bg-background/50 text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Passed</p>
              <p className="text-3xl font-bold text-green-500">{results.passes?.length || 0}</p>
            </div>
            <div className="p-4 border rounded-xl bg-background/50 text-center">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Inapplicable</p>
              <p className="text-3xl font-bold text-blue-500">{results.inapplicable?.length || 0}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Critical & Serious Violations</h2>
            {results.violations?.map((v: any, i: number) => (
              <div key={i} className="mb-6 page-break-inside-avoid">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  {v.id} 
                  <span className="text-xs border px-2 py-0.5 rounded-full uppercase tracking-wider">{v.impact}</span>
                </h4>
                <p className="text-sm mt-1 mb-2">{v.description}</p>
                <div className="bg-muted/20 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                  {v.nodes.length} element(s) failing. Help: {v.helpUrl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Accessibility (a11y) Scanner" 
        description="Run Axe-core audits and simulate vision deficiencies to ensure WCAG compliance." 
      />

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner">WCAG Audit</TabsTrigger>
          <TabsTrigger value="simulator">Vision Simulator</TabsTrigger>
          <TabsTrigger value="contrast-checker">Contrast Checker</TabsTrigger>
          <TabsTrigger value="image-alt-text">AI Alt-Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="image-alt-text" className="space-y-4">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>AI Image Alt-Text Generator</CardTitle>
              <CardDescription>Extract all images from the page and use Gemini Multimodal AI to generate missing accessible alt text.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleExtractImages()}
              />
              <Button onClick={handleExtractImages} disabled={isExtractingImages || !url}>
                {isExtractingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
                Extract Images
              </Button>
            </CardContent>
          </Card>

          {images.length > 0 && (
            <Card className="max-w-4xl">
              <CardHeader>
                <CardTitle>Extracted Images ({images.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {images.map((img, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-6 border rounded-lg p-4 bg-muted/10">
                    <div className="w-full md:w-1/3 flex items-center justify-center bg-muted/20 rounded-md overflow-hidden p-2 min-h-[150px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt="Extracted" className="max-w-full max-h-[200px] object-contain" />
                    </div>
                    <div className="w-full md:w-2/3 space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Source URL</p>
                        <p className="text-sm font-mono truncate bg-muted/30 p-1.5 rounded" title={img.src}>{img.src}</p>
                      </div>
                      
                      <div>
                         <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Current Alt Text</p>
                         {img.alt ? (
                           <p className="text-sm border border-green-500/30 bg-green-500/10 text-green-600 p-2 rounded">{img.alt}</p>
                         ) : (
                           <p className="text-sm border border-red-500/30 bg-red-500/10 text-red-500 p-2 rounded flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4"/> Missing alt attribute
                           </p>
                         )}
                      </div>

                      <div className="pt-2 border-t">
                        {altTextGenerations[img.src] ? (
                          <div className="space-y-2">
                             <p className="text-xs text-purple-500 uppercase font-bold flex items-center gap-1"><ScanFace className="h-3 w-3" /> AI Suggestion</p>
                             <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-md">
                               <p className="text-sm text-purple-200">{altTextGenerations[img.src]}</p>
                             </div>
                          </div>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="w-full sm:w-auto bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                            onClick={() => handleGenerateAltText(img.src)}
                            disabled={generatingAltText[img.src]}
                          >
                            {generatingAltText[img.src] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
                            Generate Missing Alt Text with AI
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="scanner" className="space-y-4">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Scan Target</CardTitle>
              <CardDescription>Enter a publicly accessible URL and select the WCAG standard to scan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <Select value={wcagLevel} onValueChange={setWcagLevel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="WCAG Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wcag2a">WCAG 2.0 A</SelectItem>
                  <SelectItem value="wcag2aa">WCAG 2.0 AA</SelectItem>
                  <SelectItem value="wcag21aa">WCAG 2.1 AA</SelectItem>
                  <SelectItem value="wcag2aaa">WCAG 2.0 AAA</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleScan} disabled={isScanning || !url}>
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
                Scan Now
              </Button>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 max-w-4xl">
              {error}
            </div>
          )}

          {results && (
            <div className="grid gap-6">
              <div className="flex justify-end gap-2 max-w-full">
                 <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
                 <Button variant="outline" size="sm" onClick={handleExportJSON}>Export JSON</Button>
                 <Button variant="default" size="sm" onClick={() => setIsReportView(true)} className="bg-blue-600 hover:bg-blue-700">Report Generator</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-semibold">Violations</h3>
                    </div>
                    <p className="text-3xl font-bold">{results.violations?.length || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <h3 className="font-semibold">Needs Review</h3>
                    </div>
                    <p className="text-3xl font-bold">{results.incomplete?.length || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-green-500 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <h3 className="font-semibold">Passed</h3>
                    </div>
                    <p className="text-3xl font-bold">{results.passes?.length || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-blue-500 mb-2">
                      <Info className="h-5 w-5" />
                      <h3 className="font-semibold">Inapplicable</h3>
                    </div>
                    <p className="text-3xl font-bold">{results.inapplicable?.length || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {results.violations?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Violations Detailed Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {results.violations.map((v: any, i: number) => (
                      <div key={i} className="border-b pb-6 last:border-0 last:pb-0">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          {v.id} 
                          <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider">{v.impact}</span>
                        </h4>
                        <p className="text-muted-foreground mt-1 mb-3">{v.description}</p>
                        
                        <div className="bg-muted/30 rounded-md p-3 font-mono text-sm">
                          <div className="text-muted-foreground mb-1">Help: <a href={v.helpUrl} target="_blank" className="text-primary hover:underline">{v.help}</a></div>
                        </div>
                        
                        <div className="mt-4 space-y-4">
                          <p className="text-sm font-semibold">Failing Nodes ({v.nodes.length}):</p>
                          {v.nodes.slice(0, 5).map((node: any, idx: number) => {
                            const nodeKey = `${i}-${idx}`;
                            return (
                              <div key={idx} className="bg-background border rounded-md p-3">
                                <div className="text-xs font-mono overflow-x-auto whitespace-pre text-muted-foreground mb-3">
                                  {node.html}
                                </div>
                                {healedHtml[nodeKey] ? (
                                  <div className="bg-green-500/10 border-l-4 border-green-500 p-3 mt-2 text-sm font-mono text-green-400 whitespace-pre-wrap">
                                    <div className="text-xs uppercase font-bold mb-1 text-green-500">AI Suggested Remediation:</div>
                                    {healedHtml[nodeKey]}
                                  </div>
                                ) : (
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                                    onClick={() => handleAiFix(node.html, v.id, v.description, nodeKey)}
                                    disabled={healingNode === nodeKey}
                                  >
                                    {healingNode === nodeKey ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <ScanFace className="h-3 w-3 mr-2" />}
                                    Generate AI Fix
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                          {v.nodes.length > 5 && <p className="text-xs text-muted-foreground">...and {v.nodes.length - 5} more nodes.</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulator" className="space-y-4">
           <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Vision Simulator</CardTitle>
              <CardDescription>See how your website appears to users with different forms of color blindness and vision deficiencies.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
              />
              <Select value={simType} onValueChange={setSimType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Deficiency Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achromatopsia">Achromatopsia (No color)</SelectItem>
                  <SelectItem value="deuteranopia">Deuteranopia (Green blind)</SelectItem>
                  <SelectItem value="protanopia">Protanopia (Red blind)</SelectItem>
                  <SelectItem value="tritanopia">Tritanopia (Blue blind)</SelectItem>
                  <SelectItem value="blurredVision">Blurred Vision</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSimulate} disabled={isSimulating || !url}>
                {isSimulating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                Simulate
              </Button>
            </CardContent>
          </Card>

          {simError && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 max-w-4xl">
              {simError}
            </div>
          )}

          {simImage && (
            <Card>
               <CardHeader>
                 <CardTitle className="capitalize">{simType.replace(/([A-Z])/g, ' $1').trim()} Preview</CardTitle>
               </CardHeader>
               <CardContent>
                  <img src={simImage} alt={`Simulation of ${simType}`} className="w-full h-auto border rounded shadow-md" />
               </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contrast-checker" className="space-y-4">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Color Contrast Checker</CardTitle>
              <CardDescription>Verify that your foreground and background colors meet WCAG contrast ratio requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Foreground Color</label>
                    <div className="flex gap-4 items-center">
                      <Input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-16 h-12 p-1" />
                      <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="flex-1 font-mono uppercase" placeholder="#000000" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Background Color</label>
                    <div className="flex gap-4 items-center">
                      <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-16 h-12 p-1" />
                      <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 font-mono uppercase" placeholder="#FFFFFF" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border rounded-xl p-6 text-center space-y-2">
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Contrast Ratio</p>
                    <p className={`text-5xl font-bold ${contrastRatio < 3 ? 'text-red-500' : 'text-primary'}`}>{contrastRatio.toFixed(2)}:1</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 border rounded-md text-center ${contrastRatio >= 4.5 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <p className="text-sm font-semibold mb-1">WCAG AA (Normal Text)</p>
                      <p className={`text-lg font-bold ${contrastRatio >= 4.5 ? 'text-green-500' : 'text-red-500'}`}>{contrastRatio >= 4.5 ? 'Pass' : 'Fail'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Requires 4.5:1</p>
                    </div>
                    <div className={`p-4 border rounded-md text-center ${contrastRatio >= 3 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <p className="text-sm font-semibold mb-1">WCAG AA (Large Text)</p>
                      <p className={`text-lg font-bold ${contrastRatio >= 3 ? 'text-green-500' : 'text-red-500'}`}>{contrastRatio >= 3 ? 'Pass' : 'Fail'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Requires 3.0:1</p>
                    </div>
                    <div className={`p-4 border rounded-md text-center ${contrastRatio >= 7 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <p className="text-sm font-semibold mb-1">WCAG AAA (Normal Text)</p>
                      <p className={`text-lg font-bold ${contrastRatio >= 7 ? 'text-green-500' : 'text-red-500'}`}>{contrastRatio >= 7 ? 'Pass' : 'Fail'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Requires 7.0:1</p>
                    </div>
                    <div className={`p-4 border rounded-md text-center ${contrastRatio >= 4.5 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <p className="text-sm font-semibold mb-1">WCAG AAA (Large Text)</p>
                      <p className={`text-lg font-bold ${contrastRatio >= 4.5 ? 'text-green-500' : 'text-red-500'}`}>{contrastRatio >= 4.5 ? 'Pass' : 'Fail'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Requires 4.5:1</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border rounded-lg overflow-hidden">
                <div style={{ backgroundColor: bgColor, color: fgColor }} className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Preview Text</h3>
                  <p className="text-base mb-4">This is a paragraph of normal text. It simulates how your chosen foreground and background colors will look together for body text.</p>
                  <p className="text-lg font-semibold">This is large text. It is easier to read and has lower contrast requirements.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
