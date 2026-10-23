import { cookies } from "next/headers"
import { hasPermission } from "@/lib/config/permissions"
import { ClinicalConsultClient } from "./client"

// THE FIX: Make it async and treat params as a Promise
export default async function ClinicalConsultPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value

  // THE FIX: Await the params to get the real ID without crashing
  const resolvedParams = await params;

  // Ensure they have basic standard notes access
  const canWriteNotes = hasPermission(role, "write_standard_notes")

  return <ClinicalConsultClient patientId={resolvedParams.id} canWriteNotes={canWriteNotes} />
}