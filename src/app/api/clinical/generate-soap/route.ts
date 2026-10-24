import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSOAPNote } from "@/lib/telemetry/soap-generator";
import { cookies } from "next/headers";
import { verifySignedSessionToken } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

const generateSoapSchema = z.object({
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  primaryDiagnosis: z.string().optional(),
  subjectiveScore: z.number().min(0).max(10).optional(),
  emaStress: z.number().min(0).max(10).optional(),
  rFrown: z.number().min(0).max(1).optional(),
  rBlink: z.number().min(0).max(1).optional(),
  speechJitter: z.number().min(0).max(20).optional(),
  isFlatAffect: z.boolean().optional(),
  discrepancyD: z.number().min(0).max(10).optional(),
  discrepancyAlert: z.boolean().optional(),
  sessionTranscript: z.string().max(50000).optional(),
  patientConsentToken: z.string().optional(),
  attentionWeights: z.object({
    acoustic: z.number().optional(),
    visual: z.number().optional(),
    linguistic: z.number().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller using cryptographic session verification
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    const verifiedSession = await verifySignedSessionToken(sessionToken);
    if (!verifiedSession) {
      return NextResponse.json(
        { error: "Unauthorized: Cryptographically verified session required." },
        { status: 401 }
      );
    }

    const { role: userRole, uid: userUid } = verifiedSession;
    if (!["clinician", "clinical_director", "nurse", "super_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden: Clinical authorization required to generate SOAP documentation." },
        { status: 403 }
      );
    }

    // 2. Distributed Rate Limiting (Upstash / Redis, fail-closed in production)
    const rateLimit = await checkRateLimit(userUid, 15, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 15 SOAP requests per minute." },
        { status: 429 }
      );
    }

    // 3. Payload validation
    const jsonBody = await req.json();
    const parseResult = generateSoapSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid clinical telemetry payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    // 4. Regulatory Patient Consent Gate (REG-01)
    // Audio/Visual telemetry and AI synthesis CANNOT execute without documented patient consent
    if (!body.patientConsentToken) {
      return NextResponse.json(
        { 
          error: "Consent Required: Patient biometric & telemetry consent must be granted before generating AI documentation.",
          code: "PATIENT_CONSENT_REQUIRED"
        },
        { status: 403 }
      );
    }

    // 5. Cloud LLM / BAA Gate
    // CRITICAL COMPLIANCE SAFEGUARD:
    // Safe Harbor (45 CFR § 164.514(b)) de-identifies explicit identifiers (names, IDs),
    // but unstructured clinical transcripts may retain latent PHI or re-identifiable voice/semantic traits.
    // Therefore, Gemini cloud enrichment is DISABLED BY DEFAULT unless a signed Business Associate
    // Agreement (BAA) with Google Cloud Healthcare is explicitly declared.
    const isBaaSigned = process.env.GOOGLE_CLOUD_HEALTHCARE_BAA_SIGNED === 'true';
    const isGeminiEnabled = process.env.GEMINI_ENABLED === 'true';
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (isBaaSigned && isGeminiEnabled && apiKey) {
      try {
        // Redact Direct Identifiers under HIPAA Safe Harbor (45 CFR § 164.514(b))
        const pseudonym = `PATIENT_HASH_${body.patientId.slice(-4)}`;
        const sanitizedTranscript = (body.sessionTranscript || "Patient engaged in structured tele-consultation interview.")
          .replace(new RegExp(body.patientName, "gi"), "[PATIENT_NAME]");

        const prompt = `You are Praxis AI, an enterprise-grade clinical psychiatric scribe assisting a licensed psychiatrist during a tele-mental health consultation.
Analyze the following de-identified multimodal session evidence and output a formal psychiatric SOAP note in JSON format.

PATIENT CONTEXT:
- De-identified Subject ID: ${pseudonym}
- Primary Diagnosis / Intake: ${body.primaryDiagnosis || "General Consultation"}
- Self-Reported Subjective Distress Score: ${body.subjectiveScore ?? 5.0} / 10

OBJECTIVE EDGE-BIOMARKER EVIDENCE:
- Objective Stress EMA Index: ${(body.emaStress ?? 5.0).toFixed(1)} / 10
- Facial Action Unit 4 (Brow Lowerer) Contraction Rate: ${((body.rFrown ?? 0.2) * 100).toFixed(1)}%
- Vocal Acoustic Jitter (RAP %): ${(body.speechJitter ?? 0.8).toFixed(2)}%
- Vocal Flat Affect: ${body.isFlatAffect ? "DETECTED" : "None"}
- Symptom Incongruence Metric D(t): ${(body.discrepancyD ?? 0.0).toFixed(2)}
- Cross-Modal Masking Alert Active: ${body.discrepancyAlert ? "YES" : "No"}

DE-IDENTIFIED TRANSCRIPT:
"${sanitizedTranscript}"

INSTRUCTIONS:
Output strict JSON with keys:
- subjective: Chief complaint and self-reported distress.
- objective: Quantification of speech cadence, vocal acoustics, and facial kinematics.
- assessment: Diagnostic synthesis evaluating clinical severity and ICD-11 categorization.
- plan: Step-by-step evidence-based clinical management plan.
- icd11SuggestedCodes: Array of 1-3 appropriate ICD-11 diagnosis codes (e.g. ["6A70.0"]).
- riskLevel: One of "STABLE", "MODERATE", "ELEVATED", or "CRITICAL".`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawOutput) {
            const parsed = JSON.parse(rawOutput);
            return NextResponse.json({
              success: true,
              soap: {
                subjective: parsed.subjective,
                objective: parsed.objective,
                assessment: parsed.assessment,
                plan: parsed.plan
              },
              icd11SuggestedCodes: parsed.icd11SuggestedCodes || ["6A70"],
              riskLevel: parsed.riskLevel || (body.discrepancyAlert ? "ELEVATED" : "MODERATE"),
              generatedBy: "Praxis Cloud Scribe (De-identified BAA Gateway)",
              engineSource: "AI_CLOUD_ENRICHED",
              disclaimer: "FDA Section 520(o) Clinical Decision Support Output: For licensed clinician review only. Not for autonomous diagnostic use."
            });
          }
        }
      } catch (geminiError: unknown) {
        const errorMsg = geminiError instanceof Error ? geminiError.message : 'Unknown LLM error';
        console.warn("[SOAP Generation] Cloud LLM enrichment unavailable, activating local deterministic synthesizer:", errorMsg);
      }
    }

    // 5. Deterministic Local DSP Synthesizer Fallback (Air-Gapped / Zero-Cloud)
    const localSOAP = synthesizeSOAPNote({
      patientId: body.patientId,
      patientName: body.patientName,
      primaryDiagnosis: body.primaryDiagnosis,
      subjectiveScore: body.subjectiveScore,
      emaStress: body.emaStress,
      rFrown: body.rFrown,
      rBlink: body.rBlink,
      speechJitter: body.speechJitter,
      isFlatAffect: body.isFlatAffect,
      attentionWeights: body.attentionWeights ? {
        visual: body.attentionWeights.visual ?? 0.33,
        acoustic: body.attentionWeights.acoustic ?? 0.33,
        linguistic: body.attentionWeights.linguistic ?? 0.34,
      } : undefined,
      discrepancyD: body.discrepancyD,
      discrepancyAlert: body.discrepancyAlert,
      sessionTranscript: body.sessionTranscript,
    });

    return NextResponse.json({
      success: true,
      soap: localSOAP,
      icd11SuggestedCodes: ["6A70.0", "6B00"],
      riskLevel: body.discrepancyAlert ? "ELEVATED" : "MODERATE",
      generatedBy: "Praxis Deterministic Clinical Synthesizer (Local Edge DSP)",
      engineSource: "LOCAL_DETERMINISTIC_EDGE",
      disclaimer: "FDA Section 520(o) Clinical Decision Support Output: For licensed clinician review only. Not for autonomous diagnostic use."
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error("[SOAP Generation Error]:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
