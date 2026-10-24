import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedSessionToken } from "@/lib/auth/session";

export async function GET(request: Request) {
  // CRITICAL SECURITY GATE: dev-login must NEVER be accessible in production builds
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get("role") || "clinician";
  const validRoles = [
    "clinician",
    "patient",
    "clinical_director",
    "billing_admin",
    "clinic_manager",
    "super_admin",
    "it_support",
  ];

  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid development role" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const isSecure = false; // Always false here because production was already gated above

  // Issue real cryptographically signed HMAC-SHA256 session token
  const token = await createSignedSessionToken({
    uid: `dev_${role}`,
    role: role as Parameters<typeof createSignedSessionToken>[0]['role'],
    orgId: "org_praxis_demo",
  });

  // Set hardened session cookies
  cookieStore.set("session", token, {
    path: "/",
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });

  // Also set non-critical user_role cookie for client UI convenience only
  // (Proxy and APIs NEVER trust this cookie; they verify 'session' HMAC signature)
  cookieStore.set("user_role", role, {
    path: "/",
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  const dashboardMap: Record<string, string> = {
    clinician: "/clinical/queue",
    clinical_director: "/clinical/queue",
    patient: "/patient/dashboard",
    billing_admin: "/operations/dashboard",
    clinic_manager: "/operations/dashboard",
    super_admin: "/admin/dashboard",
    it_support: "/admin/dashboard",
  };

  const destination = dashboardMap[role] || "/clinical/queue";
  return NextResponse.redirect(new URL(destination, request.url));
}
