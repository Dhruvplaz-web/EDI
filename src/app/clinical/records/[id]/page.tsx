import { cookies } from "next/headers"
import { hasPermission } from "@/lib/config/permissions"
import { ClinicalRecordClient } from "./client"

export default async function ClinicalRecordPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  
  // Enforce security
  const canWriteNotes = hasPermission(role, "write_standard_notes")
  const canPrescribe = hasPermission(role, "prescribe_standard_medication")
  const canOrderLabs = hasPermission(role, "order_diagnostics")

  return <ClinicalRecordClient 
    patientId={params.id} 
    canWriteNotes={canWriteNotes} 
    canPrescribe={canPrescribe} 
    canOrderLabs={canOrderLabs} 
  />
}
