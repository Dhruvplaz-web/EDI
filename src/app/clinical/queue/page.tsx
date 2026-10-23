import { cookies } from "next/headers"
import { hasPermission } from "@/lib/config/permissions"
import { TriageBoardClient } from "./client"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"

export default async function ClinicalQueuePage() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  
  const canWriteNotes = hasPermission(role, "write_standard_notes")

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Triage Queue</h1>
          <p className="text-muted-foreground mt-1">Live patient prioritization stream.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="px-3 py-1.5 text-sm font-medium"><AlertTriangle className="mr-2 h-4 w-4"/> 1 Critical</Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium"><Clock className="mr-2 h-4 w-4"/> Avg Wait: 14m</Badge>
        </div>
      </header>

      <TriageBoardClient role={role} canWriteNotes={canWriteNotes} />
    </div>
  )
}
