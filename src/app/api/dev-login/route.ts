import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const role = url.searchParams.get("role") || "patient"

  const cookieStore = await cookies()
  cookieStore.set("user_role", role, { path: '/' })
  cookieStore.set("session", "mock_session_token", { path: '/' })

  const dashboardMap: Record<string, string> = {
    clinician: '/clinical/queue',
    patient: '/patient/dashboard',
    billing_admin: '/operations/dashboard',
    clinic_manager: '/operations/dashboard',
    super_admin: '/admin/dashboard',
    admin: '/admin/dashboard',
    it_support: '/admin/dashboard'
  }

  const destination = dashboardMap[role] || '/clinical/queue'
  return NextResponse.redirect(new URL(destination, request.url))
}
