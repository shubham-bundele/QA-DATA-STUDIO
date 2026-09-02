"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Download, Code2, Loader2, Check } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-clipboard"

interface PlaywrightPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: any;
}

export function PlaywrightPreviewModal({ open, onOpenChange, payload }: PlaywrightPreviewModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { copy, copied } = useCopyToClipboard();

  useEffect(() => {
    if (open && payload && !code) {
      generateCode();
    }
  }, [open, payload]);

  const generateCode = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/generate-playwright', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases: payload.testCases, userStory: payload.userStory })
      });
      if (!res.ok) throw new Error("Failed to generate code");
      const data = await res.json();
      setCode(data.code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/typescript;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "e2e.spec.ts"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Playwright Automation Script
          </DialogTitle>
          <DialogDescription>
            AI-generated Playwright tests based on the analyzed user story.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4 border rounded-md relative flex flex-col bg-zinc-950">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-3 min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Generating Playwright code...</p>
            </div>
          ) : error ? (
            <div className="flex-1 p-6 text-red-500 min-h-[400px] flex items-center justify-center">
              {error}
            </div>
          ) : (
            <>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => copy(code)}>
                  {copied ? <Check className="h-4 w-4 text-green-500 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              <pre className="p-4 overflow-auto text-sm text-zinc-100 flex-1 whitespace-pre-wrap font-mono">
                {code}
              </pre>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
