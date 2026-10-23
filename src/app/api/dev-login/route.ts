import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const role = url.searchParams.get("role") || "patient"

  const cookieStore = await cookies()
  cookieStore.set("user_role", role, { path: '/' })
  cookieStore.set("session", "mock_session_token", { path: '/' })

  return NextResponse.redirect(new URL("/", request.url))
}
