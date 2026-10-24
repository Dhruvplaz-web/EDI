# India Regional Infrastructure & Data Residency Architecture

> **Document Status:** OPERATIONAL SPECIFICATION  
> **Last Updated:** Late October 2026  
> **Primary Cloud Provider:** Google Cloud Platform (GCP) / Firebase  
> **Target Production Regions:** `asia-south1` (Mumbai, India) & `asia-south2` (Delhi NCR, India)  
> **Statutory Alignment:** Digital Personal Data Protection Act 2023, CERT-In Directions 2022, Telemedicine Practice Guidelines 2020  
> **Legal Note:** DESIGNED TO SUPPORT INDIAN DATA RESIDENCY STANDARDS — REQUIRES LAWYER REVIEW.

---

## 1. Executive Summary & Sovereignty Mandate
All production health data, clinical records, consultation notes, e-prescriptions, authentication tokens, session databases, and audit logs must reside within sovereign Indian territory. In compliance with Default Decision D3 and DPDP Act provisions, the system enforces strict regional boundaries. Any secondary service lacking native Indian data processing regions is strictly prohibited from receiving Personal Data or Protected Health Information (PHI).

---

## 2. Infrastructure Inventory & Regional Configuration

| Service | Cloud Provider | Target India Region | Data Stored / Processed | Classification | Data Residency Status | Fallback / Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Firestore Database** | Google Cloud (Firebase) | `asia-south1` (Mumbai) | Organizations, User Profiles, Appointments, Encrypted Clinical Notes, E-Prescriptions, Consent Records, Audit Logs | Highly Sensitive PHI | **RESIDENT (INDIA)** | Primary in Mumbai (`asia-south1`), multi-region disaster recovery to Delhi (`asia-south2`). Fail-boot validation if outside India. |
| **Firebase Authentication** | Google Cloud | Identity service (`asia-south1` tenant routing) | Email, Phone Number (+91), Password Hashes, MFA Secret Hashes | Sensitive Personal Data | **RESIDENT (INDIA)** | Firebase Auth tenant configured to route and store credentials in Indian region. |
| **Cloud Storage** | Google Cloud | `asia-south1` (Mumbai) | E-Prescription PDFs, Clinical File Attachments, Ethics Committee Approval Docs, Nominee Declarations | Highly Sensitive PHI | **RESIDENT (INDIA)** | Customer-managed encryption keys (CMEK) stored in Google Cloud KMS Mumbai. Public access blocked. |
| **Cloud Functions / Next.js Server** | GCP / Cloud Run / Vercel Enterprise | `asia-south1` (Mumbai) | Ephemeral request payloads, SSR execution, API endpoints, Razorpay webhook validation | Ephemeral In-Flight Data | **RESIDENT (INDIA)** | Container instances deployed strictly to `asia-south1`. In-flight encryption via TLS 1.3. |
| **Vertex AI (LLM / Embeddings)** | Google Cloud | `asia-south1` (Mumbai) / `asia-south2` (Delhi) | SOAP Note Drafting (Research Mode Only, Clinician-approved text) | Ephemeral Processing | **RESIDENT (INDIA)** | Uses regional Vertex AI endpoints (`https://asia-south1-aiplatform.googleapis.com`). Zero data retained by Google for model training. |
| **WebRTC Video Consultations** | LiveKit / Janus / Native Peer-to-Peer | TURN/STUN servers in Mumbai & Chennai | In-call audio and video streams | Ephemeral Media Streams | **RESIDENT (INDIA)** | Direct peer-to-peer WebRTC mesh or Indian TURN relay. Zero server-side media recording in standard mode. |
| **Razorpay Payment Gateway** | Razorpay Software Private Limited (India) | India Multi-DC (AWS Mumbai / Equinix Mumbai) | Subscription IDs, Order IDs, Invoices, GSTIN, Tokenized Mandates | Financial Data (Tokenized) | **RESIDENT (INDIA)** | Fully domestic Indian payment aggregator regulated by RBI. No cardholder data stored on EDI servers. |
| **Transactional SMS / WhatsApp** | Gupshup / Exotel / Kaleyra (DLT Registered) | India Domestic SMS Gateways | Appointment alerts, OTP tokens, Consult links (Zero clinical data) | Restricted Operational Data | **RESIDENT (INDIA)** | TRAI DLT Principal Entity registration. No diagnosis, drug name, or clinical condition permitted in SMS bodies. |
| **Crash & Diagnostic Logging (Sentry)** | Sentry.io | Sentry US/EU Cloud | Client crashes, unhandled JS exceptions | Non-Personal Diagnostic Telemetry | **CROSS-BORDER (SCRUBBED)** | **STRICT SCRUBBER ACTIVE:** All user identifiers, IP addresses, patient names, query parameters, and consultation payloads are stripped prior to egress. |

---

## 3. Services NOT Available in India & Architectural Mitigations

### 3.1 Third-Party Transcription / Multilingual Speech-to-Text
- **Limitation:** Several leading proprietary Speech-to-Text APIs (e.g., specific OpenAI Whisper hosted endpoints or legacy transcription engines) process payloads solely in US or EU data centers.
- **Architectural Mitigation:**
  - Automated cloud transcription is **PERMANENTLY DISABLED** in standard Indian production.
  - Research Mode allows only self-hosted Whisper on an Indian Cloud Run instance or Google Cloud Speech-to-Text regional endpoint (`asia-south1`) with a signed Google Cloud Data Processing Addendum covering India.
  - No patient audio is ever transmitted to overseas transcription APIs.

### 3.2 Sentry Crash Reporting
- **Limitation:** Sentry SaaS cloud storage is hosted in the US/EU.
- **Architectural Mitigation:**
  - Client-side Sentry SDK is configured with an aggressive `beforeSend` privacy filter.
  - Strips all URLs containing patient IDs, query parameters (`?tab=...`), form inputs, and request bodies.
  - If a self-hosted Sentry instance in Mumbai is not deployed, only fatal JS runtime stack traces with zero contextual patient data are transmitted.

---

## 4. Boot-Time Regional Validation (Fail-Closed Protocol)

To prevent accidental misconfiguration or region drift in production, the application runtime enforces a mandatory boot-time assertion in `src/lib/env.ts`:

```typescript
// Production Boot Check (src/lib/env.ts)
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_NON_INDIA_REGION_OVERRIDE) {
  const allowedRegions = ['asia-south1', 'asia-south2'];
  const configuredRegion = process.env.DATA_REGION || process.env.FIRESTORE_REGION;
  
  if (!configuredRegion || !allowedRegions.includes(configuredRegion)) {
    throw new Error(
      `FATAL: Production data region [${configuredRegion}] violates Indian Data Sovereignty mandate. ` +
      `System halted. Configure DATA_REGION to 'asia-south1' (Mumbai) or 'asia-south2' (Delhi).`
    );
  }
}
```

---

## 5. Disaster Recovery & Backup Protocol

### 5.1 Backup Cadence
1. **Firestore Automated Backups:** Point-in-time recovery (PITR) enabled with 7-day continuous retention; daily full snapshot backups exported to Google Cloud Storage bucket `gs://edi-backups-asia-south1` in Mumbai.
2. **Cross-Region Replication:** Nightly snapshot mirroring from `asia-south1` (Mumbai) to `asia-south2` (Delhi) utilizing GCP Storage Transfer Service, keeping all data strictly within Indian borders.
3. **Backup Retention:**
   - Audit and clinical metadata backups: 3 years (in accordance with NMC Medical Records Retention standards).
   - Ephemeral logs and session tokens: purged automatically after 180 days.

### 5.2 Backup and Restore Drill (Bi-Annual Procedure)
1. **Initiation:** The DevOps lead provisions an isolated test namespace in `asia-south2` (Delhi).
2. **Restoration:**
   ```bash
   gcloud firestore databases restore \
     --source-backup="projects/edi-prod/locations/asia-south1/backups/DAILY_SNAPSHOT_ID" \
     --destination-database="edi-restore-drill"
   ```
3. **Integrity Validation:** Run automated validation suite asserting:
   - Tenant isolation across all sample organizations.
   - Record count consistency within 0.001% variance.
   - Decryption verification of encrypted clinical notes using test KMS credentials.
4. **Sign-Off:** Document drill completion, Recovery Time Objective (RTO < 2 hours achieved), and Recovery Point Objective (RPO < 24 hours achieved) in the compliance logbook.
