# Multilingual Speech-to-Text & Indian Voice Privacy Architecture
**Document Version:** 1.0 (India Regional STT Evaluation)  
**Status:** TECHNICAL ARCHITECTURE SPECIFICATION  
**Author:** Principal Full-Stack & Healthcare Privacy Engineer  
**Statutory Framework:** DPDP Act 2023, Telemedicine Practice Guidelines 2020, ICMR AI Ethical Framework 2023  
**Legal Note:** REQUIRES LAWYER REVIEW • REQUIRES DOCTOR REVIEW

---

## 1. Statutory Prerequisite for Voice Processing in India

Under the **Digital Personal Data Protection (DPDP) Act 2023** and **Telemedicine Practice Guidelines 2020**:
1. Voice recordings of mental health consultations contain raw vocal biomarkers, intimate personal revelations, and biometric acoustic identifiers.
2. Cross-border transfer of sensitive health audio to overseas cloud transcription providers without an explicit data processing addendum (DPA) and data residency compliance is strictly prohibited.
3. Chrome's built-in `webkitSpeechRecognition` transmits audio chunks to Google US consumer servers without a BAA/DPA. Consequently, browser-internal speech recognition is **PERMANENTLY DISABLED** for clinical consultations.

---

## 2. Comprehensive Evaluation of Multilingual STT Engines for India

We evaluated three potential speech-to-text architectures for Indian clinical tele-psychiatry across Hindi (`hi`), Marathi (`mr`), and mixed Hindi-English (Hinglish):

| Provider / Engine | India Regional Hosting | Languages Supported | B2B DPA Availability | Clinical Feasibility Assessment |
| :--- | :---: | :---: | :---: | :--- |
| **Bhashini (National Language Translation Mission, MeitY)** | **YES (NIC / Indian Cloud)** | Hindi, Marathi, 22 Official Indian Languages | Government Research API; no enterprise SLA | High acoustic potential; lacks commercial B2B healthcare DPA with enterprise indemnification. Unsuitable for commercial deployment. |
| **Google Cloud Speech-to-Text (Chirp 2 / V2 Endpoint)** | **YES (`asia-south1` Mumbai)** | Hindi, Marathi, Hinglish code-switching | **YES (Google Cloud DPA with India location)** | Qualifies for Research Mode. Supports intra-India regional endpoint (`https://asia-south1-speech.googleapis.com`) with zero model retraining on customer audio. |
| **Self-Hosted OpenAI Whisper (Large-v3 Turbo / Distil-Whisper)** | **YES (On-Prem / Cloud Run Mumbai)** | Hindi, Marathi, English | **YES (Self-Contained in Tenant VPC)** | Highest privacy posture: zero audio egress outside the clinic's dedicated Google Cloud Run instance in Mumbai. |
| **Proprietary SaaS STT (AssemblyAI, Deepgram US, Rev.ai)** | **NO (US / EU Only)** | English-only or basic multilingual | NO India region | **DISQUALIFIED:** Transmits patient voice data across international borders in violation of sovereign health data residency protocols. |

---

## 3. Production Enforcement Decisions

1. **Production Standard Mode: Speech-to-Text is OFF by Default:**
   - In standard clinical consultations, automated cloud speech-to-text transcription is **TURNED OFF**.
   - No audio stream is recorded or egressed to any transcription server.
   - Clinicians write official consultation notes manually via the structured SOAP interface.

2. **Research Mode Execution Criteria:**
   - Real-time AI transcription and SOAP note drafting may ONLY be activated if:
     1. The organization has enabled `researchMode` with a documented Institutional Ethics Committee (IEC) approval reference.
     2. Patient has granted itemized consent for `research_analysis`.
     3. An explicit Google Cloud India DPA is acknowledged in `baa-registry.ts`.
   - Even in Research Mode, the generated SOAP draft is strictly marked:  
     *"Research use only. Not for diagnosis or treatment decisions."*
   - The attending physician must independently review, verify, and edit every line before saving.
