# Praxis AI / EDI — Regulatory & Compliance Architecture Specification
**Document Version:** 2.1 (Regulatory Risk Reassessment)  
**Status:** Pre-Commercial / Investigational Clinical Prototype  
**Classification:** Clinician-assistive documentation and telemetry (investigational, not for diagnosis)  
**Legal Prerequisite:** Requires formal FDA regulatory counsel review and 513(g) Information Request before commercial marketing.

---

## 1. FDA Regulatory Classification & Section 520(o) Risk Analysis

### 1.1 The Section 520(o)(1)(E) Statutory Exclusion & Criterion 1 Risk

Under **21 U.S.C. § 360j(o)(1)(E)** (enacted via the 21st Century Cures Act), software functions are excluded from the definition of a medical device only if they satisfy **all four** statutory criteria.

In its September 2022 Final Guidance on *Clinical Decision Support Software*, the FDA clarified that software that acquires, processes, or analyzes physiological signals, patterns, or biometric features from a patient is considered to be analyzing patient signals and is **NOT excluded** under Section 520(o)(1)(E).

| Criterion | Statutory Requirement | Praxis AI Architecture & Exposure | Regulatory Risk Level |
| :--- | :--- | :--- | :---: |
| **Criterion 1** | *Not intended to acquire, process, or analyze medical images, signals from an in vitro diagnostic device, or a pattern/signal from a signal acquisition system.* | **HIGH RISK OF NON-COMPLIANCE**: Praxis AI captures raw acoustic PCM audio to extract vocal jitter, shimmer, and fundamental frequency ($F_0$), and extracts 468 facial mesh landmarks to quantify Action Unit (AU4/AU15) kinematics. The FDA frequently classifies speech acoustics and facial kinematic telemetry as patient biological/physiological signals. If the FDA deems microphone and webcam feeds as "signal acquisition systems", Praxis AI fails Criterion 1 and is **regulated as a Medical Device (SaMD)**. | **CRITICAL RISK (POTENTIAL FAILURE)** |
| **Criterion 2** | *Intended for displaying, analyzing, or printing medical information about a patient.* | Displays extracted kinematic markers, vocal prosody metrics, and self-reported intake scores. | Moderate Risk |
| **Criterion 3** | *Intended for supporting or providing recommendations to a healthcare professional.* | Provides assistive discrepancy alerts ($D(t)$) and structured draft SOAP notes solely for licensed clinician review. | Moderate Risk |
| **Criterion 4** | *Intended for enabling such healthcare professional to independently review the basis for recommendations.* | Provides full mathematical explainability (raw signals, equations, and weights are visible). | Low Risk |

### 1.2 Mandatory Regulatory Actions Before Marketing
1. **No Commercial Medical Claims**: Praxis AI must **never** be marketed or sold as an "objective diagnostic instrument", "depression detector", "suicide risk predictor", or "autonomous clinical screener".
2. **Product Reframing**: Until regulatory counsel advises otherwise, the product is classified strictly as:  
   **"Clinician-assistive documentation and telemetry (investigational, not for diagnosis)."**
3. **FDA 513(g) Request for Information**: A formal 513(g) filing should be submitted to the FDA Center for Devices and Radiological Health (CDRH) to obtain an official determination whether the bio-acoustic and facial kinematic processing functions constitute regulated SaMD under 21 CFR § 882 (Neurological/Psychiatric Diagnostic Devices).
4. **Pre-Submission (Q-Sub) Meeting**: If SaMD classification is affirmed, a Q-Submission meeting must be scheduled to establish clinical validation study protocols and determine whether a 510(k) or De Novo petition is required.

---

## 2. Mandatory Product Copy & In-App Disclaimers

Every view, HUD, documentation export, and external marketing asset must display the following statutory notice:

> [!WARNING]
> **INVESTIGATIONAL USE ONLY — NOT AN AUTONOMOUS DIAGNOSTIC INSTRUMENT**  
> "Praxis AI provides clinician-assistive documentation and telemetry for licensed healthcare professionals. This tool has not been cleared or approved by the U.S. Food and Drug Administration (FDA) to diagnose, treat, cure, or prevent any mental health disorder. It does not replace the independent clinical judgment of an attending physician or licensed mental health professional. Telemetry scores represent mathematical signal processing artifacts, not clinical diagnoses."

---

## 3. HIPAA Security & Privacy Rule Implementation Matrix

### 3.1 Technical Safeguards (45 CFR § 164.312)
- **Cryptographic Authentication (§ 164.312(a)(1)):** HMAC-SHA256 cryptographically signed session tokens; raw client cookies are never trusted. All API routes derive roles and tenant IDs strictly from verified signatures.
- **Multi-Tenant Isolation:** Database access rules enforce strict isolation by tenant `orgId` and patient `uid`. Cross-patient IDOR and cross-organization data access are blocked at the engine layer.
- **Immutable Audit Trail (§ 164.312(b)):** All security-relevant actions are appended to `/audit_logs`. Updates and deletions are rejected by database rules (`allow update, delete: if false;`).
- **Transit Encryption (§ 164.312(e)(1)):** TLS 1.3 enforced for all HTTPS traffic with HSTS (`max-age=63072000`). WebRTC audio/video feeds are encrypted peer-to-peer via DTLS-SRTP.

### 3.2 Third-Party Egress & Honest BAA Accounting

| Vendor / Service | Data Transmitted | Legal / Compliance Status |
| :--- | :--- | :---: |
| **Google Cloud (Firebase)** | User accounts, patient records, session metadata, audit logs. | **BAA Required**: Covered under Google Cloud Business Associate Agreement. |
| **Google Gemini API** | De-identified consultation transcripts & telemetry vectors. | **DISABLED BY DEFAULT**: HIPAA Safe Harbor (45 CFR § 164.514(b)) redacts direct identifiers (names, MRNs), but clinical transcripts may retain latent re-identifiable semantic traits. Cloud LLM calls are blocked unless `GOOGLE_CLOUD_HEALTHCARE_BAA_SIGNED === 'true'`. When unconfigured, a deterministic local edge synthesizer runs without cloud egress. |
| **Web Speech API** | Live microphone audio. | **THIRD-PARTY EGRESS RISK**: Chrome's implementation of Web Speech API transmits audio to Google servers without a BAA. Strict informed patient consent (REG-01) is enforced prior to activation. |
| **MediaPipe FaceMesh** | Visible light video frames. | **SELF-HOSTED / ZERO-CLOUD**: All WASM binaries and `face_landmarker.task` models are self-hosted under `/public/models/`. Zero runtime CDN calls occur. |
| **Stripe** | Clinic organization name, billing admin email, seat counts. | **EXEMPT**: Financial transactions are exempt from HIPAA under Section 1179. No clinical PHI is transmitted to Stripe. Mock mode is blocked in production. |

---

## 4. Feature Gating & Marketing Honesty Audit

In compliance with FTC truth-in-advertising guidelines and healthcare software procurement standards, unbuilt features must **never** be marketed or sold:

| Advertised Feature | Technical Implementation Status | Commercial Classification |
| :--- | :---: | :---: |
| **Edge Acoustic Prosody ($F_0$, Jitter, Shimmer)** | Implemented and verified in `src/lib/telemetry/acoustic-analyzer.ts` | Active (Investigational) |
| **Edge Facial Kinematics (AU4, AU15)** | Implemented and verified via self-hosted MediaPipe | Active (Investigational) |
| **Cross-Attention Multimodal Fusion** | Implemented and verified in `src/lib/telemetry/cross-attention-fusion.ts` | Active (Investigational) |
| **Automated Draft SOAP Notes** | Implemented and verified in `src/lib/telemetry/soap-generator.ts` | Active (Assistive Scribing) |
| **WebRTC Consultation Rooms** | Implemented and verified in `src/hooks/useWebRTC.ts` | Active |
| **Patient Telemetry Consent Gate** | Implemented and verified in `src/lib/consent/consent-store.ts` | Active (Enforced) |
| **Epic / Cerner HL7 & FHIR Sync** | **NOT BUILT** (No active EHR connector endpoints) | **Marked [Coming Soon] (Not Sold)** |
| **SAML 2.0 / Okta / Azure AD SSO** | **NOT BUILT** (Standard Firebase Auth only) | **Marked [Coming Soon] (Not Sold)** |
| **Customizable SOAP Note Templates** | **PARTIAL** (Static schema templates only) | **In Development (Not Billed Separately)** |
