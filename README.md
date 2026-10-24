<div align="center">

# 🧠 Praxis AI / EDI
### Edge-Assisted Multimodal Tele-Psychiatry & Clinical Decision Support (CDS) Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Opus_48kHz-333333?style=for-the-badge&logo=webrtc)](https://webrtc.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision_Wasm-0097A7?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![DPDP Act 2023](https://img.shields.io/badge/DPDP_Act_2023-Designed_to_Support-0052CC?style=for-the-badge)](docs/INDIA_COMPLIANCE_MATRIX.md)
[![Telemedicine Guidelines 2020](https://img.shields.io/badge/NMC_Telemedicine_2020-Designed_to_Support-emerald?style=for-the-badge)](docs/INDIA_COMPLIANCE_MATRIX.md)
[![ICMR AI Framework](https://img.shields.io/badge/ICMR_AI_2023-RUO_Governance-purple?style=for-the-badge)](docs/INDIA_COMPLIANCE_MATRIX.md)

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
> **STATUTORY CLINICAL DECISION SUPPORT & TELEMEDICINE DISCLAIMER (INDIA)**  
> Praxis AI is a clinical workflow and telemedicine assistive platform designed to support Registered Medical Practitioners (RMPs) under the **NMC Telemedicine Practice Guidelines 2020**, **Digital Personal Data Protection (DPDP) Act 2023**, and **Mental Healthcare Act 2017**. Voice/facial biomarker analytics and AI note drafting are assistive research features governed under ICMR Ethical Guidelines (2023) and CDSCO Medical Device Software guidance (`CDSCO/MD/GD/MDSW/01/2026`). They are **disabled by default**, restricted to Research Mode with recorded Institutional Ethics Committee (IEC) approval, and labeled: *"Research use only. Not for diagnosis or treatment decisions."* Praxis AI does not provide automated diagnosis, autonomous prescribing, or emergency response dispatch. Diagnostic and treatment decisions remain the sole statutory responsibility of the registered physician. (REQUIRES LAWYER REVIEW • REQUIRES DOCTOR REVIEW)

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

## ⚖️ Indian Regulatory & Compliance Architecture

- **DPDP Act 2023 & DPDP Rules 2025**: The clinic acts as the Data Fiduciary and Praxis AI operates strictly as a Data Processor under a Data Processing Agreement (DPA). Personal health data is maintained with itemized, revocable consent, strict purpose limitation, and data principal rights (access, correction, erasure, grievance, nominee).
- **NMC Telemedicine Practice Guidelines 2020**: Enforces RMP / State Medical Council verification before initiating consults, patient consent capture, RMP identification display, and structured e-prescriptions adhering to List O/A/B restrictions (prohibiting Schedule X and NDPS drugs). Minimum 3-year medical record retention.
- **CDSCO SaMD & ICMR AI Framework**: Biometric and acoustic telemetry analytics are gated behind Research Mode requiring documented Ethics Committee approval. Not cleared or certified as a medical device. (REQUIRES LAWYER REVIEW)
- For complete audit controls, risk matrices, and legal drafts, see [docs/INDIA_COMPLIANCE_MATRIX.md](docs/INDIA_COMPLIANCE_MATRIX.md) and [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

---

<div align="center">

Distributed under the [MIT License](LICENSE).

</div>
