"use client"

import { useState } from "react"
import { Monitor, Image as ImageIcon, Loader2, Maximize, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function VisualRegressionPage() {
  const [baselineUrl, setBaselineUrl] = useState("https://example.com")
  const [targetUrl, setTargetUrl] = useState("https://example.org")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleScan = async () => {
    if (!baselineUrl || !targetUrl) return
    setIsScanning(true)
    setResult(null)

    try {
      const res = await fetch('/api/visual-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baselineUrl, targetUrl })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch(e: any) {
      alert("Error generating diff: " + e.message)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Visual Regression Testing" 
        description="Compare two web pages pixel-by-pixel to detect broken UI, CSS changes, and layout regressions." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-sm">Baseline URL (Production)</CardTitle>
           </CardHeader>
           <CardContent>
             <Input value={baselineUrl} onChange={e => setBaselineUrl(e.target.value)} />
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-sm">Target URL (Staging / PR)</CardTitle>
           </CardHeader>
           <CardContent className="flex gap-2">
             <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
             <Button onClick={handleScan} disabled={isScanning} className="w-[120px]">
               {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Compare"}
             </Button>
           </CardContent>
         </Card>
      </div>

      {isScanning && (
         <Card className="mt-8 border-primary/20">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
               <div className="relative h-16 w-16">
                  <Monitor className="h-16 w-16 text-primary animate-pulse" />
                  <ImageIcon className="h-6 w-6 text-primary absolute bottom-0 right-0 animate-bounce bg-background rounded-full p-1" />
               </div>
               <h3 className="text-xl font-bold">Capturing Pixels...</h3>
               <p className="text-muted-foreground">Booting headless browser and processing images.</p>
               <Progress value={undefined} className="w-[300px]" />
            </CardContent>
         </Card>
      )}

      {result && (
        <div className="mt-8 space-y-6">
           <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border">
              <div className={`p-3 rounded-full ${result.diffPixels > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                 {result.diffPixels > 0 ? <AlertCircle className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </div>
              <div>
                 <h3 className="text-lg font-bold">{result.diffPixels > 0 ? 'Visual Differences Detected' : 'Perfect Match!'}</h3>
                 <p className="text-sm text-muted-foreground">
                    {result.diffPixels.toLocaleString()} pixels differ ({result.matchPercentage.toFixed(2)}% match).
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Baseline</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-auto max-h-[600px] border-t">
                  <img src={result.baselineImage} alt="Baseline" className="w-full object-top" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Target</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-auto max-h-[600px] border-t">
                  <img src={result.targetImage} alt="Target" className="w-full object-top" />
                </CardContent>
              </Card>
              <Card className="border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] relative">
                <CardHeader><CardTitle className="text-sm text-red-500 font-bold">Diff (Red = Changed)</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-auto max-h-[600px] border-t">
                  <img src={result.diffImage} alt="Diff" className="w-full object-top opacity-90" />
                </CardContent>
              </Card>
           </div>
        </div>
      )}
    </div>
  )
}

