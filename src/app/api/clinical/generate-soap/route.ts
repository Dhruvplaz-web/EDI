import { NextRequest, NextResponse } from "next/server";
import { synthesizeSOAPNote, GenerateSOAPParams } from "@/lib/telemetry/soap-generator";

export async function POST(req: NextRequest) {
  try {
    const body: GenerateSOAPParams = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are Praxis AI, an enterprise-grade clinical psychiatric scribe assisting a licensed psychiatrist during a tele-mental health consultation.
Analyze the following multimodal session evidence and output a formal, HIPAA-compliant psychiatric SOAP note in JSON format.

PATIENT CONTEXT:
- Patient Name: ${body.patientName} (ID: ${body.patientId})
- Primary Diagnosis / Intake: ${body.primaryDiagnosis || "General Consultation"}
- Self-Reported Subjective Anxiety/Distress Score: ${body.subjectiveScore ?? 5.0} / 10

OBJECTIVE EDGE-BIOMARKER EVIDENCE:
- Objective Stress EMA Index: ${(body.emaStress ?? 5.0).toFixed(1)} / 10
- Facial Action Unit 4 (Brow Lowerer) Contraction Rate: ${((body.rFrown ?? 0.2) * 100).toFixed(1)}%
- Eyelid Occlusion Blink Rate: ${((body.rBlink ?? 0.14) * 100).toFixed(1)}%
- Vocal Acoustic Jitter (RAP %): ${(body.speechJitter ?? 0.8).toFixed(2)}% (Normative: <1.04%, Elevated: >2.5%)
- Vocal Flat Affect (Prosodic Flattening): ${body.isFlatAffect ? "DETECTED (sigma F0 < 14 Hz)" : "None (normative prosody)"}
- Multimodal Attention Tensor Weights: Voice: ${((body.attentionWeights?.acoustic ?? 0.34) * 100).toFixed(1)}%, Face: ${((body.attentionWeights?.visual ?? 0.33) * 100).toFixed(1)}%, Text: ${((body.attentionWeights?.linguistic ?? 0.33) * 100).toFixed(1)}%
- Symptom Masking / Incongruence Metric D(t): ${(body.discrepancyD ?? 0.0).toFixed(2)}
- Cross-Modal Masking Alert Active: ${body.discrepancyAlert ? "YES (Patient verbally minimized symptoms while involuntary acoustic/facial biomarkers showed severe autonomic distress)" : "No (Modality alignment verified)"}

LIVE CONSULTATION TRANSCRIPT:
"${body.sessionTranscript || "Patient engaged in structured tele-consultation interview."}"

INSTRUCTIONS:
Output strict JSON with the following keys:
- subjective: Detailed description of patient's chief complaint, mood, sleep/appetite reports, and relevant direct quotes from dialogue.
- objective: Professional quantification of appearance, speech cadence, affect, vocal acoustics (jitter, prosody), and facial kinematics.
- assessment: Diagnostic synthesis evaluating clinical severity, differential diagnostic impressions, symptom masking risk, and DSM-5 / ICD-11 severity categorization.
- plan: Step-by-step evidence-based management plan (psychotherapy, safety protocol, biofeedback, follow-up schedule).
- icd11SuggestedCodes: Array of 1-3 appropriate ICD-11 diagnosis codes (e.g., ["6A70.0", "6B00"]).
- riskLevel: One of "STABLE", "MODERATE", "ELEVATED", or "CRITICAL".`;

        // 4-second circuit breaker timeout to protect clinician responsiveness
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

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
              generatedBy: "Gemini 1.5 Flash Ambient Scribe (Cloud Enriched)",
              engineSource: "AI_CLOUD_ENRICHED"
            });
          }
        } else if (geminiRes.status === 429) {
          console.warn("[CircuitBreaker] Gemini rate limit (429) hit. Seamlessly falling back to local deterministic scribe.");
        }
      } catch (geminiError: unknown) {
        const errorMsg = geminiError instanceof Error ? geminiError.message : "Timeout/Network error";
        console.warn("[CircuitBreaker] Cloud AI unavailable (" + errorMsg + "), falling back to deterministic scribe.");
      }
    }

    // High-fidelity local deterministic clinical synthesis (Zero tokens, Zero cloud cost, 100% reliable)
    const localResult = synthesizeSOAPNote(body);
    return NextResponse.json({
      ...localResult,
      generatedBy: "Praxis Multi-Modal Clinical NLP Scribe (Local Deterministic Mode)",
      engineSource: "LOCAL_DETERMINISTIC_DSP"
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate clinical SOAP note";
    console.error("SOAP generation route error:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
