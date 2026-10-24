import { NextResponse } from "next/server";
import { patientService } from "@/lib/firebase/patient-service";
import { cookies } from "next/headers";

export async function POST() {
  // Never expose database seed mutations in production builds
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value;

  if (role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized: Super Admin role required to seed test cohorts." }, { status: 403 });
  }

  try {
    const result = await patientService.seedDemoCohort();
    return NextResponse.json({
      success: true,
      message: "Synthetic demo clinical cohort seeded into demo tenant partition",
      details: result
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to seed demo data";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
