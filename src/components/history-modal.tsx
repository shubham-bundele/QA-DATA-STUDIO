"use client"

import { useState, useEffect } from "react"
import { getStoryHistory } from "@/core/db/history-db"
import { AnalysisResult } from "@/core/engines/user-story-analyzer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { History, Clock } from "lucide-react"

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: AnalysisResult) => void;
}

export function HistoryModal({ open, onOpenChange, onSelect }: HistoryModalProps) {
  const [history, setHistory] = useState<{id: string, createdAt: number, result: AnalysisResult}[]>([]);

  useEffect(() => {
    if (open) {
      getStoryHistory().then(setHistory).catch(console.error);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Generation History
          </DialogTitle>
          <DialogDescription>
            View and reload previously analyzed user stories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No history found.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelect(item.result);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {item.result.summary?.totalCases || 0} Test Cases
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm line-clamp-2 text-muted-foreground">
                  {item.result.userStory || "No story text saved"}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
