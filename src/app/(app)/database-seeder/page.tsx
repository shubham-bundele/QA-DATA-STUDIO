"use client"

import { useState } from "react"
import { Database, Play, Loader2, Plus, Trash2, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function DatabaseSeederPage() {
  const [dbType, setDbType] = useState("postgres")
  const [connectionString, setConnectionString] = useState("postgresql://user:password@localhost:5432/mydb")
  const [tableName, setTableName] = useState("users")
  const [count, setCount] = useState(100)
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<any>(null)

  const [columns, setColumns] = useState([{ id: "1", name: "id", type: "uuid" }])

  const addColumn = () => {
    setColumns([...columns, { id: Date.now().toString(), name: "", type: "string" }])
  }

  const updateColumn = (id: string, field: string, value: string) => {
    setColumns(columns.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const removeColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id))
  }

  const handleSeed = async () => {
    if (!connectionString || !tableName) return
    setIsSeeding(true)
    setResult(null)

    try {
      const res = await fetch('/api/seed-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbType,
          connectionString,
          tableName,
          count,
          columns
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch(e: any) {
      alert("Error seeding database: " + e.message)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Direct Database Seeder" 
        description="Connect directly to your staging database and inject thousands of rows of realistic mock data." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Database Engine</Label>
                <Select value={dbType} onValueChange={setDbType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL / MariaDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Connection String</Label>
                <Input 
                  value={connectionString} 
                  onChange={(e) => setConnectionString(e.target.value)} 
                  placeholder={dbType === 'postgres' ? "postgresql://user:password@localhost:5432/mydb" : "mysql://user:password@localhost:3306/mydb"} 
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label>Target Table Name</Label>
                    <Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="users" className="mt-1" />
                 </div>
                 <div>
                    <Label>Rows to Insert</Label>
                    <Input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value)||0)} className="mt-1" />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schema Definition</CardTitle>
              <CardDescription>Define the columns and the type of mock data to generate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {columns.map((col, idx) => (
                <div key={col.id} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input value={col.name} onChange={(e) => updateColumn(col.id, 'name', e.target.value)} placeholder="column_name" />
                  </div>
                  <div className="flex-1">
                    <Select value={col.type} onValueChange={(v) => updateColumn(col.id, 'type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uuid">UUID v4</SelectItem>
                        <SelectItem value="string">Random String</SelectItem>
                        <SelectItem value="name">Full Name</SelectItem>
                        <SelectItem value="email">Email Address</SelectItem>
                        <SelectItem value="number">Random Number (0-100)</SelectItem>
                        <SelectItem value="boolean">Boolean (True/False)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeColumn(col.id)} disabled={columns.length === 1} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addColumn} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Column
              </Button>
            </CardContent>
          </Card>

          <Button onClick={handleSeed} disabled={isSeeding || !connectionString || !tableName} className="w-full gap-2 text-lg h-12 shadow-md">
             {isSeeding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
             {isSeeding ? "Injecting Data..." : `Inject ${count} Rows`}
          </Button>

          {result && (
             <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                   <h4 className="font-bold text-green-600 dark:text-green-400">Injection Complete</h4>
                   <p className="text-sm text-green-700/80 dark:text-green-300/80">Successfully inserted {result.inserted} rows into {tableName}.</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

