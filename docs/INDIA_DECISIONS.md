# Architectural & Product Decisions: India Market Adaptation

**Project:** Praxis AI / EDI — Tele-Psychiatry & Clinical Platform  
**Target Market:** Republic of India  
**Date of Baseline:** October 2026  

---

## 1. Default Decisions (D1 to D7)

| Decision ID | Domain | Chosen Direction | Rationale & Statutory Grounding |
| :--- | :--- | :--- | :--- |
| **D1** | **Customer & Fiduciary Model** | B2B tool for registered clinics, hospitals, and licensed psychiatrists in India. The clinic/hospital is the **Data Fiduciary**; Praxis AI is the **Data Processor**. Direct-to-patient marketing is excluded. | Under the DPDP Act 2023 § 2(i) and § 8, the healthcare provider determining the purpose and means of clinical consultation is the Data Fiduciary. Praxis AI processes data solely on behalf of the clinic under a Data Processing Agreement (DPA). |
| **D2** | **Launch Scope & Biomarker De-Scoping** | Core launch scope: encrypted WebRTC video/audio consults, patient intake, scheduling, clinician note writer, compliant e-prescriptions, and INR billing. Vocal/facial biomarkers, discrepancy alerts $D(t)$, and AI note generation are **OFF BY DEFAULT** across all standard organizations. | CDSCO Guidance Document on Medical Device Software (CDSCO/MD/GD/MDSW/01/2026) classifies automated diagnostic feature extraction as SaMD (Class B/C). Turning them off by default keeps core practice management clear of medical device licensing requirements. |
| **D2-A** | **Research Mode Gating** | Biomarkers and AI note formulation are available solely in "Research Mode" for organizations that upload a valid Institutional Ethics Committee (IEC) approval reference, approval date, approval document, and signed research agreement, backed by super-admin audit signoff. | Aligns with ICMR Ethical Guidelines for AI in Biomedical Research and Healthcare (2023) requiring ethics committee oversight, transparency, and explicit patient consent for research algorithms. |
| **D3** | **Hosting & Data Residency** | Primary hosting in Google Cloud India regions: `asia-south1` (Mumbai) or `asia-south2` (Delhi) for all health data, databases, media pipelines, backups, and logs. Any cloud service lacking an India region is blocked from receiving health data. | While DPDP Act § 16 utilizes a negative-list approach, sectoral best practices (CERT-In 180-day log residency, MoHFW electronic health record standards, and DISHA draft principles) necessitate storing health records within Indian territory. |
| **D4** | **Payment Infrastructure** | Razorpay Subscriptions (UPI Autopay, Indian debit/credit cards, e-NACH) for INR transactions behind a clean `PaymentProvider` abstraction interface. Retain Stripe solely for international cross-border customers. | Razorpay provides native compliance with RBI recurring-payment regulations (pre-debit notifications, ₹15,000 threshold, UPI Autopay). Stripe India is constrained by RBI card storage guidelines and lack of localized UPI Autopay flows. |
| **D5** | **Supported Languages** | English, Hindi (हिन्दी), and Marathi (मराठी). All patient-facing notices, consent flows, crisis helpline displays, and prescription instructions are localized. Machine translations are marked `NEEDS HUMAN REVIEW`. | English and Hindi provide nationwide accessibility; Marathi provides depth for western India healthcare hubs (Maharashtra). Fulfills DPDP requirement to offer notices in Eighth Schedule languages. |
| **D6** | **Authentication & Staff MFA** | Email + Indian Mobile Phone OTP (+91) for patients and clinicians; mandatory second-factor Multi-Factor Authentication (MFA) for all clinical and administrative staff roles. | Mobile phone OTP is the ubiquitous authentication standard in India. Mandatory staff MFA mitigates credential stuffing and protects sensitive mental health records. |
| **D7** | **Minors (Under 18 Years)** | Minor accounts require linked adult Guardian accounts with verifiable guardian consent. All facial kinematic, bio-acoustic analysis, and research profiling features are permanently locked OFF for minors. | DPDP Act 2023 § 9(1) mandates verifiable parental/guardian consent, and § 9(3) strictly bans tracking or behavioral monitoring of children. |

---

## 2. Additional Architectural & Compliance Decisions

### D8. Aadhaar Number Avoidance (Data Minimization)
- **Decision:** The platform does **NOT** collect, store, or process 12-digit Aadhaar numbers or Aadhaar card images.
- **Reason:** Aadhaar storage requires strict UIDAI compliance, Aadhaar Vault encryption, and specialized authorization. Avoiding Aadhaar completely eliminates identity-leak liabilities under the Aadhaar Act, 2016 while remaining fully compliant with DPDP data minimization principles. Patient identity is established via name, mobile phone OTP, Date of Birth, and optional 14-digit ABHA.

### D9. ABDM (Ayushman Bharat Digital Mission) Boundary
- **Decision:** ABHA (Ayushman Bharat Health Account) is supported as an optional field on patient profiles. Full sandbox certification (M1/M2/M3) is structured as a dedicated modular adapter so the standalone product can launch independently for private clinics without being blocked on National Health Authority (NHA) sandbox queue clearance.
- **Reason:** ABDM is voluntary for standalone private outpatient psychiatric clinics not empanelled with public insurance schemes.

### D10. Drug Prescription Hard Blocks
- **Decision:** Under NMC Telemedicine Guidelines and IPS Telepsychiatry Operational Guidelines, the e-prescription engine strictly prevents selecting or prescribing Schedule X medications and NDPS Act substances (including sedatives, hypnotics, opioids, and psychotropic habit-forming agents). Additionally, clinical psychologists are programmatically blocked from generating or signing prescriptions.
- **Reason:** Telemedicine guidelines strictly prohibit remote prescription of Schedule X and NDPS drugs; prescribing them remotely is a non-bailable offense under the NDPS Act, 1985 and invites cancellation of RMP registration.

### D11. Dual-Clock Incident Notification Runbook
- **Decision:** Implement a dual-clock breach notification tracker: (1) 6-hour alert clock for CERT-In (cybersecurity incidents), and (2) 72-hour detailed report clock for the Data Protection Board of India (DPBI) under DPDP Rule 7.
- **Reason:** Reconciles the conflicting timelines between CERT-In Directions 2022 and DPDP Act 2023 without missing either statutory deadline.
