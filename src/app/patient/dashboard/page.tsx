import { cookies } from "next/headers"
import { hasPermission } from "@/lib/config/permissions"
import { PatientDashboardClient } from "./client"

export default async function PatientDashboardPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  
  const canViewPHR = hasPermission(role, "view_own_phr")

  return <PatientDashboardClient role={role} canViewPHR={canViewPHR} />
}
