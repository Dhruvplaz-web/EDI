# Praxis AI / EDI — Regulatory & Compliance Architecture Specification
**Document Version:** 2.0  
**Status:** In Progress / Pre-Commercial Production Readiness  
**Target Class:** FDA Section 520(o) Non-Device Clinical Decision Support (CDS) & HIPAA Security Rule (45 CFR § 164)

---

## 1. Statutory FDA Non-Device CDS Exemption Analysis

Under **21 U.S.C. § 360j(o)(1)(E)**, enacted by the 21st Century Cures Act, software functions are excluded from the definition of a medical device if they satisfy all four statutory criteria:

| Criterion | Statutory Requirement | Praxis AI Technical Implementation | Status |
| :--- | :--- | :--- | :---: |
| **Criterion 1** | Not intended to acquire, process, or analyze medical images or signals from in vitro diagnostic devices. | Analyzes video and audio streams from standard consumer webcams/microphones (visible light and acoustic PCM). Does not interface with IVDs, CT/MRI scanners, or diagnostic physiological probes. | **COMPLIANT** |
| **Criterion 2** | Intended for displaying, analyzing, or printing medical information about a patient. | Displays extracted kinematic markers (AU4, AU15), vocal prosody metrics ($F_0$, jitter, shimmer), and self-reported intake scores. | **COMPLIANT** |
| **Criterion 3** | Intended for supporting or providing recommendations to a healthcare professional about prevention, diagnosis, or treatment. | Provides real-time assistive discrepancy alerts ($D(t)$) and structured draft SOAP documentation solely for review by licensed psychiatric clinicians. | **COMPLIANT** |
| **Criterion 4** | Intended for enabling such healthcare professional to independently review the basis for such recommendations. | Full explainability provided: every alert displays the raw inputs, mathematical formulas, and individual modality weights, allowing the clinician to independently verify the rationale. | **COMPLIANT** |

> [!IMPORTANT]
> **Mandatory UI Disclaimer Notice**:  
> "Praxis AI is a clinical decision support (CDS) tool intended solely to assist qualified healthcare professionals. It does not provide autonomous clinical diagnoses, emergency medical dispatch, or direct therapeutic instructions. Attending healthcare professionals retain sole responsibility for patient care."

---

## 2. HIPAA Security & Privacy Rule Implementation Matrix

### 2.1 Technical Safeguards (45 CFR § 164.312)

- **Access Control (§ 164.312(a)(1)):** Unique user identification, role-based access control (RBAC), automatic session termination, and cryptographically verified session cookies.
- **Audit Controls (§ 164.312(b)):** Immutable, append-only audit trail stored in Firestore collection `/audit_logs`. Client-side tampering and deletion are blocked at the database engine level via Firestore rules (`allow update, delete: if false;`).
- **Integrity Controls (§ 164.312(c)(1)):** Cryptographic signing for webhooks and authenticated server mutations; state validation via Zod schemas.
- **Transmission Security (§ 164.312(e)(1)):** Mandatory TLS 1.3 encryption in transit with HSTS (`max-age=63072000`). Peer-to-peer audio/video transmission encrypted via WebRTC DTLS-SRTP.

### 2.2 Data Egress & Third-Party Vendor BAA Audit

Under HIPAA, any cloud service provider handling Protected Health Information (PHI) must execute a formal **Business Associate Agreement (BAA)**:

| Vendor / Service | Data Transmitted | BAA Status | Remediation Required |
| :--- | :--- | :---: | :--- |
| **Google Cloud / Firebase** | User authentication, patient metadata, session records, audit logs. | **Required** | Execute Google Cloud BAA covering Firebase Authentication and Cloud Firestore. |
| **Google Gemini API** | De-identified clinical transcripts and telemetry for draft SOAP note synthesis. | **Required** | Use Google Cloud Vertex AI under Google Cloud Enterprise BAA; apply HIPAA Safe Harbor de-identification (45 CFR § 164.514(b)) prior to payload dispatch. |
| **Web Speech API (Chrome)** | Audio transcription stream. | **Non-Covered** | Web Speech API in Chrome sends audio to Google speech servers without BAA. Must either: (a) require explicit patient informed consent, or (b) provide an on-premises / WebAssembly local Whisper transcription fallback. |
| **Stripe** | Clinic organization name, billing admin email, seat count, payment card. | **Exempt** | Financial payment processing is exempt under HIPAA § 1179. No clinical PHI is transmitted to Stripe. |
| **MediaPipe / JSDelivr CDN** | None (Asset delivery only). | **Exempt** | Assets self-hosted under `/public/models/` to achieve zero-CDN air-gapped isolation. |

---

## 3. Data Retention & Destruction Policy

- **Active Clinical Telemetry**: Retained according to clinic subscription tier (30 days for Solo Practice, 1 year for Group Practice, 7 years for Enterprise Health Systems).
- **Audit Logs**: Retained for a minimum of **6 years** from creation date, in compliance with 45 CFR § 164.316(b)(2)(i).
- **Session Media**: Praxis AI does **not** store raw video or audio recordings on server storage. Streams exist ephemerally in RAM on the client device during the active WebRTC call.

---

## 4. Informed Patient Consent Flow Requirements

Before initiating biometric extraction or AI analysis during any tele-consultation:

1. **Digital Consent Presentation**: Patient must be presented with an explanation of the objective telemetry modalities (facial Action Unit tracking and vocal prosody extraction).
2. **Explicit Opt-In**: A cryptographically recorded timestamped consent record must be written to `/patients/{patientId}/consent` prior to camera/mic pipeline activation.
3. **Right of Revocation**: The patient can toggle off facial kinematics or acoustic analysis at any moment during the consultation without terminating the video call.

---

## 5. Security & Incident Response Protocol

In the event of suspected unauthorized PHI disclosure:
1. **Containment**: Revoke active session tokens immediately via Firebase Admin SDK.
2. **Audit Forensics**: Query immutable `/audit_logs` for actor UID, IP addresses, and document IDs accessed.
3. **Breach Notification**: If unencrypted PHI was exposed, notify the affected Covered Entity within **24 hours** to satisfy HIPAA Breach Notification Rule requirements (45 CFR §§ 164.400–414).
