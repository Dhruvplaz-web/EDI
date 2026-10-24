<div align="center">

# 🧠 Praxis AI / EDI
### Edge-Assisted Multimodal Tele-Psychiatry & Clinical Decision Support (CDS) Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Opus_48kHz-333333?style=for-the-badge&logo=webrtc)](https://webrtc.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision_Wasm-0097A7?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![Compliance](https://img.shields.io/badge/FDA_Section_520(o)-Non--Device_CDS_Criteria-emerald?style=for-the-badge)](docs/COMPLIANCE.md)
[![HIPAA](https://img.shields.io/badge/HIPAA-Workflow_Aligned-0052CC?style=for-the-badge)](docs/COMPLIANCE.md)

<p align="center">
  <strong>Tele-psychiatry platform featuring real-time client-side acoustic prosody DSP, 3D facial Action Unit kinematics, and multi-head cross-attention fusion designed to assist licensed clinicians in detecting objective markers of affective distress and symptom masking.</strong>
</p>

[Key Features](#-key-architectural-features) •
[Clinical Focus](#-clinical-focus--symptom-masking) •
[Mathematical Engine](#-mathematical--dsp-engine) •
[System Architecture](#-system-architecture) •
[Role-Based Portals](#-role-based-portal-architecture) •
[Literature Foundations](#-literature-foundations--model-calibration) •
[Quickstart](#-quickstart--installation) •
[Regulatory Compliance](#-regulatory--statutory-compliance)

---

</div>

> [!IMPORTANT]
> **STATUTORY CLINICAL DECISION SUPPORT (CDS) DISCLAIMER**  
> Praxis AI is a Clinical Decision Support tool designed under **21 U.S.C. § 360j(o)(1)(E)** (FDA Section 520(o) Non-Device CDS criteria). It is intended solely to assist licensed psychiatric and behavioral healthcare professionals by displaying objective kinematic and acoustic telemetry. It **does not provide automated diagnosis, autonomous treatment decisions, or emergency dispatch**. All diagnostic conclusions and prescribing decisions remain the sole responsibility of the attending clinician.

---

## 📌 Platform Overview

**Praxis AI (EDI)** provides objective, real-time bio-behavioral telemetry during tele-mental health consultations to assist clinicians when evaluating affective states and potential symptom masking:

- **Visual Kinematics (Edge Computer Vision)**: MediaPipe FaceMesh (468 landmarks) tracking corrugator supercilii contraction (**AU4 Brow Lowerer**) and depressor anguli oris activation (**AU15 Lip Depressor**) with 3D affine head-pose normalization.
- **Acoustic Digital Signal Processing (Edge DSP)**: Real-time `AudioWorklet` processor executing the **YIN autocorrelation pitch algorithm** to extract fundamental frequency ($F_0$), vocal period **jitter %**, amplitude **shimmer %**, and dynamic **SNR noise floor tracking**.
- **Psychiatric NLP & Speech Cadence**: Real-time lexical analysis and speech cadence velocity (**Words Per Minute**) with safety boundary checks.
- **Cross-Attention Multimodal Fusion**: Calibrated cross-modal attention weights that generate an interpretable composite distress index ($1.0 - 10.0$) and a **Discrepancy Index ($D(t)$)** when subjective verbal minimization contrasts with elevated involuntary autonomic cues.
- **B2B SaaS Multi-Tenancy & Billing**: Strict organization data isolation (`orgId`), Stripe subscription tiers (Solo Practice, Clinical Group, Enterprise Health System), and separated synthetic demo cohorts.

---

## 🔍 Clinical Focus & Symptom Masking

In tele-psychiatry, reliance on subjective self-reporting alone can be complicated by social desirability bias, shame, or "smiling depression" (where an individual verbally reports low distress while involuntary vocal or facial kinematics reflect acute distress):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRADITIONAL TELE-PSYCHIATRY                     │
│                                                                        │
│  Patient Self-Report (PHQ-9 = 3) ──> Doctor Observes Friendly Smile    │
│  "I'm feeling much better today" ──> Risk of Misdiagnosing Stability   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                     PRAXIS AI MULTIMODAL CDS CO-PILOT                  │
│                                                                        │
│  Linguistic Self-Report:  "I'm feeling fine"     ──> S(t) = 2.0 (Low)  │
│  Facial AU4 / AU15:       Micro-frown leakage    ──> AU15 = 78%        │
│  Vocal Jitter & Shimmer:  Acoustic tension       ──> Jitter = 3.8%     │
│  Cross-Attention Fusion:  Discrepancy D(t) = 4.2 ──> ⚠️ MASKING ALERT │
│                                                                        │
│  Outcome: Clinician receives objective prompt to probe deeper safely   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Role-Based Portal Architecture

Praxis AI implements 4 isolated healthcare environments with tenant scoping:

| Portal Role | Primary Route | Clinical & Operational Capabilities |
|:---|:---|:---|
| **Clinician / Psychiatrist** | `/clinical/queue` | Real-time triage queue, patient risk metrics, longitudinal charts, active consultation suite with Radar HUD, automated SOAP notes, and biomarker export. |
| **Patient** | `/patient/dashboard` | Telehealth consultation stream, box breathing exercises, 5-4-3-2-1 sensory grounding, digital prescriptions, mood telemetry journals, and crisis resource access. |
| **Operations / Clinic Manager** | `/operations/dashboard` | Room grid utilization, bandwidth telemetry, clinic capacity management, and operational analytics. |
| **Super Admin / IT Support** | `/admin/dashboard` & `/admin/billing` | Clinic licensing and seat management, subscription tiers, Stripe customer portal, immutable audit trail inspection, and break-glass overrides. |

---

## 📊 Literature Foundations & Model Calibration

The telemetry indices and discrepancy metrics in Praxis AI are mathematically calibrated to empirical distributions published in affective computing and psychiatric literature:

1. **Vocal Prosody & Jitter**: Normative vocal jitter (< 1.04%) vs. depressed/strained phonation (> 2.5%) based on clinical acoustic benchmarks (*De Cheveigné & Kawahara, 2002; Horwitz et al., 2013*).
2. **Facial Action Coding System (FACS)**: Morphological tracking of AU4 (corrugator supercilii) and AU15 (depressor anguli oris) following Ekman & Friesen (1978) and affective depression profiles identified in the DAIC-WOZ corpus (*DeVault et al., 2014; Haque et al., 2018*).
3. **Cross-Attention Fusion Matrix**: The orthogonal projection weights ($W_Q, W_K, W_V$) normalize facial kinematic, vocal jitter, and linguistic sentiment streams into a unified coordinate space.

> [!NOTE]
> *Validation Status:* Synthetic cohort simulations are provided for demonstration and testing purposes. Prospective clinical trial evaluations with institutional review boards (IRB) are required prior to commercial diagnostic deployment.

---

## 🚀 Quickstart & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.18.0 or higher (or pnpm v12+)
- Modern browser with WebRTC and Web Audio API support

### 1. Clone & Install
```bash
git clone https://github.com/Dhruvplaz-web/EDI.git
cd EDI
pnpm install # or npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```
Configure your Firebase and Stripe keys in `.env.local`.

### 3. Run Automated Tests
```bash
pnpm test
```

### 4. Start Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` to access the application.

---

## ⚖️ Regulatory & Statutory Compliance

- **HIPAA Security Rule (45 CFR Part 160 & Part 164)**: Real-time telemetry processing is executed locally on client hardware. When cloud LLM transcription is active, direct identifiers are de-identified under Safe Harbor guidelines (45 CFR § 164.514(b)), and execution requires a signed Business Associate Agreement (BAA).
- **FDA Section 520(o) Non-Device CDS**: Praxis AI presents transparent raw inputs, formulas, and reasoning to enable the clinician to independently review the basis for all recommendations.
- For complete audit controls, risk assessments, and vendor BAA requirements, see [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

---

<div align="center">

Distributed under the [MIT License](LICENSE).

</div>
