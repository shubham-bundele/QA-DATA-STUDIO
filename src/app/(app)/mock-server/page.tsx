"use client"

import { useState, useEffect } from "react"
import { Server, Plus, Save, Trash2, CheckCircle, ExternalLink, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type MockEndpoint = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  delay: number;
  responseBody: string;
};

export default function MockServerPage() {
  const [mocks, setMocks] = useState<MockEndpoint[]>([{
    id: "default-1",
    path: "users/1",
    method: "GET",
    statusCode: 200,
    delay: 100,
    responseBody: "{\n  \"id\": 1,\n  \"name\": \"Leanne Graham\",\n  \"username\": \"Bret\",\n  \"email\": \"Sincere@april.biz\"\n}"
  }])
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/mock-manager')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setMocks(data)
      })
  }, [])

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-mocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (!res.ok) throw new Error("Failed to generate");
      const generatedMocks = await res.json();
      
      const newMocks = generatedMocks.map((m: any) => ({
        ...m,
        id: Date.now().toString() + Math.random(),
      }));
      
      setMocks(prev => [...newMocks, ...prev]);
      setIsAiModalOpen(false);
      setAiPrompt("");
    } catch (e) {
      alert("Failed to generate mocks. Check server logs.");
    } finally {
      setIsGenerating(false);
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/mock-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mocks)
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch(e) {
      alert("Error saving mocks")
    } finally {
      setIsSaving(false)
    }
  }

  const addMock = () => {
    setMocks([...mocks, {
      id: Date.now().toString(),
      method: "GET",
      path: "/users",
      statusCode: 200,
      delay: 0,
      responseBody: '{\n  "message": "Hello World"\n}'
    }])
  }

  const updateMock = (id: string, field: keyof MockEndpoint, value: any) => {
    setMocks(mocks.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const removeMock = (id: string) => {
    setMocks(mocks.filter(m => m.id !== id))
  }

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Live Mock Server" 
        description="Create stub endpoints that return custom JSON. Useful for testing frontends before the real API is ready." 
      />

      <div className="flex justify-between items-center mt-6">
        <div className="flex gap-2">
          <Button onClick={addMock} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add Endpoint
          </Button>
          <Button onClick={() => setIsAiModalOpen(true)} variant="outline" className="gap-2 border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
            <Sparkles className="w-4 h-4" /> AI Mock Architect
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
           {isSaved ? <CheckCircle className="w-4 h-4 text-green-300" /> : <Save className="w-4 h-4" />}
           {isSaving ? 'Deploying...' : isSaved ? 'Deployed!' : 'Deploy Live'}
        </Button>
      </div>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-purple-500" />
               AI Mock Architect
            </DialogTitle>
            <DialogDescription>
              Describe your API domain, and AI will instantly architect and generate full CRUD endpoints with perfectly formatted JSON data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>API Description</Label>
            <textarea 
               className="mt-2 w-full h-32 rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
               placeholder="e.g. A to-do list app with tasks containing titles, descriptions, due dates, and completion status."
               value={aiPrompt}
               onChange={e => setAiPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAiGenerate} disabled={!aiPrompt || isGenerating} className="bg-purple-600 hover:bg-purple-700">
               {isGenerating ? "Architecting API..." : "Generate Endpoints"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {mocks.length === 0 && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
              <Server className="w-12 h-12 mb-4 opacity-20" />
              <p>No mock endpoints defined yet.</p>
           </div>
        )}

        {mocks.map((mock) => (
          <Card key={mock.id} className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className={`font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground ${
                     mock.method === 'GET' ? 'text-blue-400' :
                     mock.method === 'POST' ? 'text-green-400' :
                     mock.method === 'DELETE' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {mock.method}
                  </span>
                  {mock.path}
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeMock(mock.id)} className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label className="text-xs">Path</Label>
                   <Input 
                     value={mock.path} 
                     onChange={(e) => updateMock(mock.id, 'path', e.target.value)} 
                     className="mt-1 h-8 text-xs font-mono" 
                   />
                </div>
                <div>
                   <Label className="text-xs">Method</Label>
                   <Select value={mock.method} onValueChange={(v) => updateMock(mock.id, 'method', v)}>
                     <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="GET">GET</SelectItem>
                       <SelectItem value="POST">POST</SelectItem>
                       <SelectItem value="PUT">PUT</SelectItem>
                       <SelectItem value="DELETE">DELETE</SelectItem>
                       <SelectItem value="PATCH">PATCH</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label className="text-xs">Status Code</Label>
                   <Input 
                     type="number"
                     value={mock.statusCode} 
                     onChange={(e) => updateMock(mock.id, 'statusCode', parseInt(e.target.value) || 200)} 
                     className="mt-1 h-8 text-xs font-mono" 
                   />
                </div>
                <div>
                   <Label className="text-xs">Delay (ms)</Label>
                   <Input 
                     type="number"
                     value={mock.delay} 
                     onChange={(e) => updateMock(mock.id, 'delay', parseInt(e.target.value) || 0)} 
                     className="mt-1 h-8 text-xs font-mono" 
                   />
                </div>
              </div>

              <div>
                <Label className="text-xs">JSON Response</Label>
                <textarea 
                  value={mock.responseBody}
                  onChange={(e) => updateMock(mock.id, 'responseBody', e.target.value)}
                  className="mt-1 font-mono flex min-h-[120px] w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y"
                />
              </div>

              <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
                 <span className="truncate pr-2">Live URL:</span>
                 <a 
                   href={`${hostUrl}/api/mock${mock.path.startsWith('/') ? mock.path : '/' + mock.path}`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="text-primary hover:underline flex items-center gap-1 font-mono truncate max-w-[200px]"
                 >
                    /api/mock{mock.path.startsWith('/') ? mock.path : '/' + mock.path} <ExternalLink className="h-3 w-3" />
                 </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

