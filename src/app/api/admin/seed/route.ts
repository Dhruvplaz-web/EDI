import { NextResponse } from "next/server";
import { patientService } from "@/lib/firebase/patient-service";
import { cookies } from "next/headers";
import { verifySignedSessionToken } from "@/lib/auth/session";

export async function POST() {
  // Never expose database seed mutations in production builds
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const verified = await verifySignedSessionToken(sessionToken);

  if (!verified || verified.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: Super Admin session required to seed test cohorts." },
      { status: 403 }
    );
  }

  try {
    const result = await patientService.seedDemoCohort();
    return NextResponse.json({
      success: true,
      message: "Synthetic demo clinical cohort seeded into demo tenant partition",
      details: result,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to seed demo data";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
