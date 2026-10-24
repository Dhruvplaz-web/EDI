# DATA RETENTION AND ERASURE SCHEDULE

> **DRAFT: REQUIRES LAWYER REVIEW**  
> **Status:** Reconciles the Digital Personal Data Protection Act, 2023 (§ 8(7) Retention Limitation) with the National Medical Commission Telemedicine Practice Guidelines, 2020 (Clause 3.6 Retention of Records) and CERT-In Directions, 2022.  
> **Matrix Reference:** Matrix Rows 1 (DPDP Retention & Erasure), 3 (NMC 3-Year Record Hold), 5 (CERT-In 180-Day Log Rule), 8 (GST & Tax Retention).  
> **Last Updated:** 24 October 2026

---

## 1. Statutory Retention Reconciliation

A critical legal interface in Indian healthcare software is the conflict between **DPDP Act Section 8(7)** (mandating data erasure when the purpose is fulfilled or consent withdrawn) and **sectoral statutory record-keeping mandates**.

**Governing Legal Principle:**  
Under Section 8(7) of the DPDP Act, personal data must be erased *unless retention is necessary for compliance with any law for the time being in force*. The National Medical Commission (NMC) regulations, Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002, and Telemedicine Practice Guidelines 2020 constitute binding sectoral law. Therefore, **clinical records and e-prescriptions are placed on mandatory legal hold and cannot be destroyed prior to statutory expiration**.

---

## 2. Retention Schedule by Data Category

| Data Category | Specific Record Elements | Retention Period | Statutory Authority | Erasure Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Clinical Consultation Records** | Doctor consultation notes, diagnoses, psychiatric evaluations, SOAP records | **Minimum 3 Years** from date of consultation | Clause 3.6, NMC Telemedicine Guidelines 2020 | Archived under legal hold; auto-purge strictly blocked. |
| **E-Prescriptions** | Standardized prescription PDFs, drug schedules, dosage records | **Minimum 3 Years** | Clause 3.6, NMC Telemedicine Guidelines 2020 & Pharmacy Act 1948 | Immutable archive; manual clinical destruction protocol only. |
| **System Security & Audit Logs** | Server access logs, hash-chained PHI audit logs, break-glass events | **180 Days (6 Months)** within Indian jurisdiction | Direction 2(v), CERT-In Directions 2022 | Append-only store; rolling archive to cold storage in Mumbai. |
| **Billing & Tax Records** | Tax invoices, GSTIN records, Razorpay mandate tokens, SAC records | **6 Years** | Section 36 CGST Act 2017 & Section 44AA Income-tax Act 1961 | Secure cold archive in encrypted bucket; CA sign-off required for purge. |
| **Non-Mandatory Derived Telemetry** | Vocal pitch metrics, action units (AU4/AU15), facial kinematics | **Tier TTL: 30 to 365 Days** (Instant erasure on consent withdrawal) | Section 8(7) DPDP Act 2023 | Automated Cloud Scheduler purge; instant wipe on consent revocation. |
| **Transient Session Video / Audio** | Live WebRTC RTP streams between client browsers | **0 Days (Ephemeral)** | DPDP Data Minimization Principle | Streams pass peer-to-peer / encrypted SFU in RAM; zero disk persistence. |
| **Unsubmitted Intake Drafts** | Abandoned patient intake questionnaires | **30 Days** | DPDP Purpose Limitation | Purged automatically on the 31st day. |

---

## 3. Handling Patient Erasure Requests (§ 12(3) DPDP Act)

When a Data Principal submits a statutory request for data erasure:
1. **Immediate Purge:** All derived non-mandatory telemetry, marketing identifiers, and temporary session drafts are erased within twenty-four (24) hours.
2. **Clinical Legal Hold:** The patient is issued a formal statutory notice explaining that under Clause 3.6 of the NMC Telemedicine Practice Guidelines 2020, medical consultation notes and electronic prescriptions are legally preserved for the remainder of the 3-year statutory period.
3. **Audit Trail:** An append-only audit log entry (`TELEMETRY_RETENTION_PURGE`) records the specific data elements wiped and the legal hold applied.
