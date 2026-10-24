# Praxis AI / EDI — Indian Regulatory & Healthcare Compliance Architecture
**Document Version:** 3.0 (India Localization Architecture)  
**Status:** Pre-Commercial / Internal Demo & Clinical Research Prototype  
**Classification:** Clinician-assistive telemedicine workflow and investigational telemetry tool  
**Legal Prerequisite:** Requires formal Indian healthcare regulatory counsel review and CDSCO consultant assessment before commercial deployment. (REQUIRES LAWYER REVIEW)

---

## 1. Statutory Grounding & Anti-Misrepresentation Notice

> [!WARNING]
> **STATUTORY DISCLAIMER (DESIGNED TO SUPPORT INDIAN REGULATORY REQUIREMENTS)**  
> Praxis AI is an assistive tele-psychiatry platform engineered to support Registered Medical Practitioners (RMPs) in India. It is **NOT** approved, certified, or registered by the Central Drugs Standard Control Organisation (CDSCO) as a medical device. It does **NOT** provide automated diagnosis, autonomous treatment decisions, or emergency response dispatch. Telemetry scores (acoustic jitter/shimmer and facial Action Unit kinematics) and AI-generated SOAP drafts are investigational research features that are **disabled by default**. Diagnostic and treatment determinations remain the exclusive statutory responsibility of the attending physician registered with the National Medical Commission (NMC) or State Medical Council. (REQUIRES LAWYER REVIEW • REQUIRES DOCTOR REVIEW)

---

## 2. CDSCO SaMD & Medical Device Rules 2017 Classification Analysis

### 2.1 Software as a Medical Device (SaMD) Analysis
Under the Medical Devices Rules 2017 and the CDSCO Guidance on Medical Device Software (`CDSCO/MD/GD/MDSW/01/2026`), software intended for diagnosis, prevention, monitoring, treatment, or alleviation of disease or physiological processes is classified as a medical device.

| Feature / Module | Intended Use & Architecture | Indian Regulatory Exposure (CDSCO) | Risk Classification & Safeguard |
| :--- | :--- | :--- | :---: |
| **Encrypted WebRTC Consult Room** | Real-time audio/video communication between RMP and patient | Non-Device Telemedicine Infrastructure | Exempt Communication Software |
| **E-Prescription Generator** | Structured digital prescription generation matching NMC 2020 format | Clinical Workflow & Records Management | Non-Device Administrative Tool |
| **AI SOAP Note Drafting** | Speech-to-text transcription synthesis into clinical note drafts | Assistive Documentation Tool (No diagnostic claims) | Class A / Non-Device (RUO Mode only, requires clinician edit) |
| **Bio-Acoustic Prosody DSP** | Client-side AudioWorklet extracting vocal jitter, shimmer, and $F_0$ | Analyzes patient physiological/acoustic signals | **Class B SaMD Risk** — Gated behind Research Mode (RUO) |
| **Facial Kinematic Analytics** | MediaPipe FaceMesh tracking AU4 / AU15 kinematics | Analyzes patient facial micromovements / kinematics | **Class B SaMD Risk** — Gated behind Research Mode (RUO) |
| **Discrepancy Index ($D(t)$)** | Compares verbal intake minimization with involuntary motor cues | Potential clinical decision support for affective state | **Class B/C SaMD Risk** — Gated behind Research Mode (RUO) |
| **Crisis Keyword Flagging** | Assistive flags for self-harm/suicide expressions (Hinglish/HI/MR) | High-consequence triage alert flag | Assistive notification only; not a safety net (D8) |

### 2.2 Research Use Only (RUO) Architecture
To prevent regulatory non-compliance under Medical Devices Rules 2017:
1. **Disabled by Default:** Server-side feature flags (`biomarkerScores: false`, `discrepancyAlerts: false`, `aiNoteDrafting: false`, `researchMode: false`) strictly block execution for standard clinical tenants.
2. **Ethics Committee Gating:** Activation of Research Mode requires an Institutional Ethics Committee (IEC) approval reference, approval document upload, signed research agreement, and Super Admin audit authorization.
3. **Clinical Record Isolation:** In Research Mode, biomarker telemetry and AI drafts are explicitly watermarked: *"Research use only. Not for diagnosis or treatment decisions."* No telemetry scores enter the official medical record unless the physician explicitly saves them as a distinct "Research Note".

---

## 3. Digital Personal Data Protection (DPDP) Act 2023 Architecture

### 3.1 Fiduciary vs. Processor Separation (§ 8 DPDP Act)
- **Clinic as Data Fiduciary:** The healthcare institution determines the purpose and means of processing patient health records.
- **Praxis AI as Data Processor:** Operates strictly on behalf of the clinic under a binding Data Processing Agreement (DPA).
- **Sub-Processor Controls:** Sub-processors (Google Cloud India, Razorpay, Sentry, SMS DLT gateways) are maintained under strict processing agreements with zero personal data leakage.

### 3.2 Notice, Consent & Revocation (§ 5 & § 6 DPDP Act)
- **Itemized & Unbundled:** Discrete consents for telemedicine consultation, camera/microphone access, call recording (if any), research analytics, and storage/sharing.
- **Trilingual Notice:** Notice and consent provided in English, Hindi (`hi`), and Marathi (`mr`).
- **Ease of Withdrawal:** Patients can withdraw consent at any time (including mid-call). Server actions immediately halt related telemetry and flag derived non-mandatory data for purging.

### 3.3 Data Principal Rights Management (§ 11 – § 14 DPDP Act)
The platform exposes dedicated workflows and audit registers for:
1. **Right to Access (§ 11):** Summary of personal data processed, identities of processors, and machine-readable data export.
2. **Right to Correction & Erasure (§ 12):** In-app workflow for correcting demographic data and requesting data erasure (subject to legal retention holds under NMC rules).
3. **Right to Grievance Redressal (§ 13):** Grievance submission queue with contact details for the designated Grievance Officer published on the privacy page.
4. **Right to Nominate (§ 14):** Designation of a Nominated Representative in the event of death or incapacity (aligned with Mental Healthcare Act 2017 § 14).

### 3.4 Protection of Minors (§ 9 DPDP Act)
- Captures Date of Birth (DOB) during patient registration.
- Individuals under 18 years of age require verified guardian linking and explicit guardian consent.
- All behavioral tracking, profiling, and affective biomarker analytics are permanently disabled for minors (Default D7).

---

## 4. NMC Telemedicine Practice Guidelines 2020 Compliance Controls

1. **RMP Verification Gate:** Clinicians must record their NMC or State Medical Council registration number, year, and council. Account verification must be validated before the system permits initiating consultations.
2. **Role Boundaries (Psychologists vs. Psychiatrists):** Clinical psychologists (registered with Rehabilitation Council of India - RCI) are restricted from issuing prescriptions at the API and database rule layer.
3. **Prescription Drug Class Restrictions:** E-prescriptions match the NMC standardized template. The system strictly blocks remote prescription of Schedule X and Narcotic Drugs and Psychotropic Substances (NDPS) Act medications.
4. **Record Retention:** Telemedicine consultation logs and clinical records are maintained for a mandatory minimum of 3 years in accordance with NMC guidelines.

---

## 5. Hosting & Data Residency Architecture

- **Primary Regions:** Google Cloud `asia-south1` (Mumbai) and `asia-south2` (Delhi) for Firestore, Cloud Storage, and server compute.
- **Regional Boot Gate:** In production mode, the server validates cloud region configurations at boot and halts execution if health data stores are configured outside Indian borders.
- **CERT-In Compliance:** System audit logs and authentication timestamps are retained for a minimum of 180 days within Indian borders as mandated by CERT-In Directions (April 2022).
