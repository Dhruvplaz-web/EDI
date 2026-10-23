import { NextResponse } from "next/server";
import { patientService } from "@/lib/firebase/patient-service";

export async function GET() {
  try {
    const result = await patientService.seedBenchmarkData();
    return NextResponse.json({
      success: true,
      message: "Benchmark clinical data seeded successfully",
      details: result
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to seed benchmark data";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
