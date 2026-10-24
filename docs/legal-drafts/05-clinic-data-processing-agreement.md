# CLINIC DATA PROCESSING AGREEMENT (DPA)

> **DRAFT: REQUIRES LAWYER REVIEW**  
> **Status:** Executed pursuant to Section 8(2) of the Digital Personal Data Protection Act, 2023 (DPDP Act) and Rule 4 of the DPDP Rules, 2025.  
> **Matrix Reference:** Matrix Rows 1 (DPDP Act 2023), 5 (IT Act 2000 & CERT-In), 9 (India Data Residency).  
> **Last Updated:** 24 October 2026

---

## 1. Statutory Context & Roles

This Data Processing Agreement (**"DPA"**) supplements the Master SaaS Terms of Service between **[Insert Clinic Name]** (the **"Data Fiduciary"**) and **Praxis AI Technologies Private Limited** (the **"Data Processor"**).

- **Data Fiduciary:** Determines the purpose and means of processing personal data relating to patients, clinicians, and clinic administrative personnel.
- **Data Processor:** Processes digital personal data strictly on behalf of and pursuant to the documented written instructions of the Data Fiduciary under Section 8(2) of the DPDP Act.

---

## 2. Details of Processing Activities (Schedule 1)

- **Subject Matter:** Provision of telemedicine software, electronic medical records, e-prescriptions, clinical scheduling, and optional assistive research telemetry.
- **Duration:** Term of the Master SaaS Agreement plus any statutory medical record retention hold periods mandated by Indian law.
- **Categories of Data Principals:** Registered patients, authorized family guardians of minor patients, nominated representatives, and clinic staff.
- **Categories of Personal Data:** Name, age, gender, contact number, state, medical histories, psychiatric symptom documentation, e-prescriptions, consultation audio/video streams, and immutable access audit logs.

---

## 3. Obligations of the Data Processor (§ 8 DPDP Act)

3.1. **Strict Processing Limitation:** The Processor shall process personal data solely on documented instructions from the Fiduciary and shall not process personal data for any secondary purpose, commercial advertising, or independent AI model pre-training.

3.2. **Personnel Confidentiality:** The Processor warrants that all employees, contractors, and engineers having access to personal data have executed binding non-disclosure agreements and undergo annual healthcare privacy training under the DPDP Act and the Mental Healthcare Act 2017.

3.3. **Technical and Organizational Safeguards (§ 8(5) DPDP Act):** The Processor implements:
- AES-256 encryption at rest and TLS 1.3 encryption in transit.
- Multi-factor authentication (MFA) enforcement for all administrative and engineering access.
- Role-based tenant isolation ensuring zero cross-clinic data leakage.
- Immutable, hash-chained server audit logs for all PHI access events.

3.4. **Data Residency and Cross-Border Transfers (§ 16 DPDP Act):**
- All personal data, health records, audio/video consultation streams, backups, and logs are hosted and processed strictly within **India** (`asia-south1` Mumbai / `asia-south2` Delhi).
- The Processor warrants that no personal data shall be transferred, mirrored, or accessed outside the territory of India without the express written authorization of the Fiduciary.

---

## 4. Sub-Processor Management (§ 8(2) DPDP Act)

4.1. **Authorized Sub-Processors:** The Fiduciary grants general authorization for the following vetted infrastructure sub-processors:

| Sub-Processor | Role / Service | Processing Location | Data Handled |
| :--- | :--- | :--- | :--- |
| **Google Cloud India** | Cloud infrastructure, Firestore, Cloud Storage | Mumbai (`asia-south1`) / Delhi (`asia-south2`) | Encrypted database records, backups |
| **Razorpay Software Pvt Ltd** | Subscription billing and e-mandates | India (ISO 27001 / PCI-DSS) | Billing contact details, GSTIN, payment tokens |
| **TRAI-Registered DLT Gateways** | Transactional OTP SMS & consult links | India | Masked phone numbers, transaction IDs |
| **Functional Error Monitoring** | System crash diagnostics | Zero-PHI configuration (IP & text stripped) | Sanitized stack traces |

4.2. **Notification of Changes:** The Processor shall maintain an up-to-date public Sub-Processor register at `/subprocessors` and notify the Fiduciary at least thirty (30) days prior to onboarding any new sub-processor.

---

## 5. Assistance with Data Principal Rights (§ 11–14 DPDP Act)

The Processor provides the Fiduciary with automated technical features within the software platform to enable the Fiduciary to satisfy Data Principal requests within the statutory thirty (30) day timeline:
1. **Access and Export:** Generating machine-readable exports of patient profiles and medical records.
2. **Correction:** Updating patient demographic and intake records.
3. **Erasure:** Securely purging derived non-mandatory data upon valid withdrawal of consent, while maintaining clinical records subject to the 3-year NMC legal hold.
4. **Nominated Representatives:** Tracking registered nominees under § 14 DPDP Act and § 14 Mental Healthcare Act 2017.

---

## 6. Personal Data Breach Assistance (§ 8(6) DPDP Act & CERT-In)

In the event of a confirmed personal data breach affecting Fiduciary data:
1. **Initial Notification:** The Processor shall notify the Fiduciary in writing without undue delay and in any event within **twenty-four (24) hours** of confirming the incident.
2. **Incident Details:** The notification shall include the nature of the breach, affected data categories, estimated number of Data Principals, immediate remedial actions taken, and recommended mitigations.
3. **Regulatory Reporting Support:** The Processor shall assist the Fiduciary in generating formatted statutory reports required for:
   - **CERT-In Directions 2022:** Mandating reporting within six (6) hours of confirmation.
   - **Data Protection Board of India (DPBI):** Mandating reporting in prescribed Form under DPDP Rules.

---

## 7. Return and Erasure of Personal Data

Upon termination of the Master SaaS Agreement:
1. The Fiduciary may request a full export of its database records in structured JSON/PDF formats within thirty (30) days.
2. Upon completion of export or after sixty (60) days of contract expiry, the Processor shall cryptographically wipe all active database copies and caches.
3. Backup archives shall be securely overwritten in accordance with the Processor's 30-day snapshot purge cycle.
