import { cookies } from "next/headers"
import { hasPermission } from "@/lib/config/permissions"
import { OperationsDashboardClient } from "./client"

export default async function OperationsDashboardPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  
  const canViewBilling = hasPermission(role, "view_hospital_billing_data")

  return <OperationsDashboardClient role={role} canViewBilling={canViewBilling} />
}
