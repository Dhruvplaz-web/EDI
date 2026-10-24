# Legal & Regulatory Counsel Briefing: Questions for Indian Healthcare & Privacy Counsel

> **Document Status:** WORKING SPECIFICATION / COUNSEL BRIEF  
> **Last Updated:** Late October 2026  
> **Classification:** PRIVILEGED & CONFIDENTIAL ATTORNEY-CLIENT COMMUNICATION PREPARED FOR LEGAL REVIEW  
> **Product Name:** Praxis AI / EDI (B2B Telepsychiatry & Clinical Workflow SaaS)  
> **Client Identity:** Technology platform provider acting as **Data Processor** for Indian clinical establishments and registered psychiatric practices (**Data Fiduciaries**).

---

## 1. Questions for Healthcare & Telemedicine Legal Counsel
*(Focus: Telemedicine Practice Guidelines 2020, Telepsychiatry Operational Guidelines 2020, Mental Healthcare Act 2017, NMC Act 2019, Pharmacy Act 1948 / Drugs and Cosmetics Act 1940)*

### 1.1 Registered Medical Practitioner (RMP) Verification & Scope of Practice
1. **Verification Mechanism:** Under Section 1.3 of the Telemedicine Practice Guidelines (TPG) 2020, telemedicine platforms must ensure consultations are conducted only by RMPs registered with State Medical Councils (SMC) or the National Medical Commission (NMC). In the absence of an open, automated national NMC API, does manual verification of the physician's registration certificate and annual audit of State Medical Council gazettes satisfy the platform's statutory due diligence obligation, or does platform liability attach if an RMP submits forged credentials?
2. **Clinical Psychologists vs. Psychiatrists:** Under the Rehabilitation Council of India (RCI) Act 1992 and the National Commission for Allied and Healthcare Professions (NCAHP) Act 2021, clinical psychologists are licensed mental health professionals but are not RMPs under the NMC Act 2019. Our platform enforces a server-side lock preventing clinical psychologists from issuing prescriptions (Rx features disabled). Does offering psychological therapy sessions on the same platform require separate institutional registration or specific disclaimers separating psychiatric care from clinical psychology consultations?

### 1.2 Prescriptions and Drug Classification Boundaries
3. **Telepsychiatry Drug Lists (Lists O, A, B vs. Prohibited):** Telepsychiatry Operational Guidelines (2020) and TPG (2020) define permissible drugs (List O: over-the-counter; List A: first-consultation video only; List B: follow-up consultation only) and explicitly prohibit remote prescription of Schedule X and NDPS substances.
   - For psychiatric practice, many essential medications (e.g., mood stabilizers, SSRIs, atypical antipsychotics) are Schedule H or H1. Does initiating an SSRI (e.g., Escitalopram or Sertraline) during an initial video consultation comply strictly with List A ("first-line medications for well-established diagnosis"), or does current NMC interpretation require an in-person physical examination prior to initiating any psychotropic Schedule H/H1 regimen?
   - In instances where a patient undergoes a follow-up consultation (List B), can an RMP adjust dosages of Schedule H psychotropics remotely via our digital e-prescription engine without prior in-person re-evaluation?
4. **Digital Signatures on E-Prescriptions:** Section 5.5 of TPG 2020 requires e-prescriptions to bear the RMP's signature. Does an electronic image of the RMP's signature appended to an audit-trailed, tamper-evident PDF generated from an authenticated session satisfy the Information Technology Act 2000 (Section 5/Section 10A), or is an Aadhaar e-Sign or Class 3 PKI digital signature token mandatory for legal validity under the Drugs and Cosmetics Rules?

### 1.3 Mental Healthcare Act 2017 (MHCA) Interactions
5. **Nominated Representative (§ 14 & § 17):** The MHCA 2017 guarantees patients the right to appoint a Nominated Representative (NR). When a patient registers an NR in our platform:
   - What specific authorization triggers allow the NR to access clinical records, consult notes, or emergency escalation details without violating the patient's confidentiality rights under Section 23 of the MHCA?
   - In the event of acute psychiatric emergencies (e.g., imminent self-harm or suicidal ideation), does sharing emergency contact details or consult logs with the registered NR or clinic emergency team protect the platform and clinician from statutory liability under MHCA Section 23?
6. **Consultation Recordings & Confidentiality (§ 23):** Section 23 of the MHCA imposes strict confidentiality obligations, prohibiting the disclosure of any mental health photograph, video, or clinical record. In our architecture, video consult sessions are ephemeral peer-to-peer WebRTC streams with zero server-side recording by default. If a clinic enables recording for clinical training or research, what explicit statutory consent documentation must be executed to insulate the clinic and platform from criminal penalties under MHCA Section 108?

### 1.4 Clinical Records Retention
7. **Retention Duration Mandate:** Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002 (Regulation 1.3) mandate that medical records be maintained for a period of 3 years from the date of commencement of treatment. However, civil limitation periods under the Limitation Act 1963 for medical negligence claims extend to 3 years from injury/discovery. What is the recommended minimum and maximum retention period for electronic mental health records, prescription logs, and audit trails?

---

## 2. Questions for Data Protection & Privacy Counsel
*(Focus: Digital Personal Data Protection Act 2023, DPDP Rules 2025, CERT-In Directions 2022, Information Technology Act 2000 / SPDI Rules 2011)*

### 2.1 Data Fiduciary vs. Data Processor Allocation & DPA
1. **Fiduciary vs. Processor Status (§ 2(i), § 2(k), § 8):** In our B2B architecture, the subscriber clinic or hospital determines the medical purposes and clinical workflows (Data Fiduciary), while Praxis AI processes consultation audio/video, intake questionnaires, and e-prescriptions strictly on behalf of the clinic (Data Processor).
   - Does providing automated assistive tooling (e.g., crisis keyword detection or optional research-mode transcription) risk elevating our status to that of a joint Data Fiduciary under the DPDP Act 2023?
   - What mandatory statutory clauses must be incorporated into our B2B Data Processing Agreement (DPA) under Section 8(1) to ensure the clinic indemnifies Praxis AI for consents they obtain or fail to obtain?

### 2.2 Consent Architecture & Notice Requirements (§ 5 & § 6)
2. **Itemized, Multi-Lingual Notice (§ 5):** The DPDP Act requires that notice accompany or precede a request for consent, providing an itemized description of personal data collected, specific processing purposes, right of withdrawal, grievance redressal, and complaint mechanism to the Data Protection Board of India (DPBI).
   - Can the statutory notice be presented via an unbundled multi-tab or collapsible digital interface in English, Hindi, and Marathi, or does DPBI draft guidance require a consolidated static document?
   - If a patient withdraws consent during an active teleconsultation (§ 6(4)), our platform immediately halts non-essential telemetry and research streams while preserving clinical notes and prescription logs required under NMC retention rules. Does statutory retention under NMC regulations override the right to erasure under DPDP Section 12(3) as an exception under Section 17(1)(b) (compliance with law)?

### 2.3 Protection of Children & Minors (§ 9)
3. **Verifiable Parental/Guardian Consent (§ 9(1)):** Section 9(1) of the DPDP Act mandates verifiable parental consent before processing any personal data of an individual below 18 years of age.
   - What specific verification standard (e.g., DigiLocker guardian linkage, government photo ID matching, OTP to parent's verified phone, or signed guardian declaration) is accepted by the DPBI to constitute "verifiable consent"?
   - Section 9(3) bars tracking, behavioral monitoring, or targeted advertising directed at children. While our platform permanently disables all biomarker and telemetry tracking for minors, does generating an assistive crisis keyword alert (detecting suicide risk) in a pediatric telepsychiatry intake constitute prohibited "behavioral monitoring," or does it qualify for statutory exemption under Section 9(4) (health or well-being purposes)?

### 2.4 Incident Response & Dual-Clock Reporting
4. **CERT-In (6 Hours) vs. DPBI (72 Hours):**
   - CERT-In Directions (April 2022) mandate reporting of cybersecurity incidents within 6 hours of discovery.
   - DPDP Rules 2025 (Rule 7) mandate prompt notification of personal data breaches to the DPBI followed by a detailed report within 72 hours, alongside simultaneous notification to affected Data Principals.
   - If an unauthorized access incident impacts encrypted health databases hosted in AWS/GCP Mumbai, how should the initial notification be sequenced to prevent conflicting statements between CERT-In and the DPBI?

### 2.5 Cross-Border Data Flows & Telemetry Routing (§ 16)
5. **India-Only Residency vs. Global Sentry/Analytics:** Section 16 of the DPDP Act permits cross-border transfer unless restricted by the Central Government negative list. However, healthcare best practices and draft health data guidelines emphasize local storage. If crash telemetry or non-identifiable client diagnostic metrics (sanitized of all personal data and PHI) route to European or US telemetry endpoints (e.g., Sentry), does this trigger compliance exposure under DPDP or sectoral health guidelines?

---

## 3. Questions for CDSCO Medical Device & Software Regulatory Consultant
*(Focus: Medical Devices Rules 2017, CDSCO Guidance CDSCO/MD/GD/MDSW/01/2026, Drugs and Cosmetics Act 1940)*

### 3.1 Software as a Medical Device (SaMD) Classification
1. **Clinical Scoping of Core Features:** Under the *Guidance Document on Medical Device Software (CDSCO/MD/GD/MDSW/01/2026)*:
   - Does a WebRTC audio-video teleconsultation platform equipped with digital scheduling, intake forms, and e-prescription templates fall outside the definition of a Medical Device (Rule 3(zb) of MDR 2017)?
   - Does an algorithmic crisis detection module that scans patient intake text for suicide-related terminology and surfaces a non-diagnostic visual warning to the attending psychiatrist constitute Clinical Decision Support Software (CDSS) or a Class B SaMD?
2. **Biomarker Scores & Discrepancy Index ($D(t)$):**
   - Our platform contains experimental computer-vision and acoustic modules calculating vocal jitter/shimmer and facial Action Unit kinematics (AU4, AU12, AU15) to produce an affective discrepancy score. We have placed this strictly in "Research Mode" (OFF by default, accessible only to clinics with an approved Institutional Ethics Committee trial protocol).
   - Under CDSCO rules, does labeling this feature as *"Research Use Only (RUO) — Not for Diagnostic or Clinical Treatment Decisions"* and gating it behind super-admin approval effectively exempt Praxis AI from pre-market manufacturing license requirements (Form MD-5 / Form MD-14)?
   - What specific software disclaimers, watermarks, and user agreement terms must accompany RUO outputs to prevent CDSCO enforcement officers from reclassifying the SaaS platform as an unlicensed Medical Device?

### 3.2 AI Algorithm Changes & Post-Market Obligations
3. **Continuous Learning vs. Locked Models:** If an organization trains or fine-tunes an internal clinical summarization model on localized Indian language datasets (Hindi/Marathi):
   - Does updating the underlying LLM weights or prompt engineering templates require an amendment to the CDSCO investigational device authorization or notification under MDR 2017?
   - What verification documentation (verification & validation protocols, clinical performance evaluation reports) must the platform retain to withstand a CDSCO regulatory inspection?

---

## 4. Instructions for Legal Advisors
When reviewing these questions, please provide:
1. Specific citations to applicable Acts, Gazette Notifications, CDSCO circulars, and judicial precedents.
2. Practical operational thresholds (e.g., minimum viable documentation for parental verification).
3. Redline recommendations for our draft agreements (`docs/legal-drafts/`).
4. Classification of operational risks into **Critical (immediate regulatory sanction/criminal liability)**, **Moderate (statutory compliance gap)**, and **Low (industry standard best-practice)**.
