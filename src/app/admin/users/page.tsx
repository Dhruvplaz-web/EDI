import { cookies } from "next/headers"
import { hasPermission } from "@/lib/config/permissions"
import { AdminUsersClient } from "./client"

export default async function AdminUsersPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  
  const canManageRoles = hasPermission(role, "manage_rbac_assignments")
  const canViewLogs = hasPermission(role, "view_system_audit_logs")

  return <AdminUsersClient canManageRoles={canManageRoles} canViewLogs={canViewLogs} />
}
