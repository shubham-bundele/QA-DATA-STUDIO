"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface DbConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: any[]; // The generated records to stream
  tableName?: string;
}

export function DbConnectionModal({ open, onOpenChange, payload, tableName = "users" }: DbConnectionModalProps) {
  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState("5432")
  const [user, setUser] = useState("postgres")
  const [password, setPassword] = useState("")
  const [dbName, setDbName] = useState("qa_db")
  const [targetTable, setTargetTable] = useState(tableName)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleStream = async () => {
    setIsStreaming(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch('/api/stream-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection: { host, port, user, password, dbName },
          table: targetTable,
          records: payload
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Streaming failed")
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Stream to Database
          </DialogTitle>
          <DialogDescription>
            Insert {payload?.length || 0} records directly into your staging database.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-semibold text-lg">Streaming Complete!</p>
              <p className="text-sm text-muted-foreground">
                Successfully inserted {payload?.length} rows into {targetTable}.
              </p>
            </div>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="host" className="text-right">Host</Label>
              <Input id="host" value={host} onChange={e => setHost(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="port" className="text-right">Port</Label>
              <Input id="port" value={port} onChange={e => setPort(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dbName" className="text-right">Database</Label>
              <Input id="dbName" value={dbName} onChange={e => setDbName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">User</Label>
              <Input id="user" value={user} onChange={e => setUser(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table" className="text-right">Table</Label>
              <Input id="table" value={targetTable} onChange={e => setTargetTable(e.target.value)} className="col-span-3" />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mt-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleStream} disabled={isStreaming} className="w-full mt-2">
              {isStreaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isStreaming ? "Streaming..." : "Stream Records"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
