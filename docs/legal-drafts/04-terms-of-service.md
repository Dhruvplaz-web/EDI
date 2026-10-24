# MASTER B2B SAAS TERMS OF SERVICE (INDIA)

> **DRAFT: REQUIRES LAWYER REVIEW**  
> **Status:** Designed to support Indian B2B clinical software deployment under the Information Technology Act 2000, DPDP Act 2023, NMC Telemedicine Practice Guidelines 2020, and the Mental Healthcare Act 2017.  
> **Matrix Reference:** Matrix Rows 1 (DPDP), 2 (CDSCO SaMD), 3 (NMC 2020 Telemedicine), 5 (IT Act 2000), 8 (Payments & GST SAC 998313).  
> **Last Updated:** 24 October 2026

---

## 1. Parties and Relationship

This Agreement is entered into by and between:
1. **Praxis AI Technologies Private Limited** (**"Praxis AI"**, **"Service Provider"**, or **"Data Processor"**), a company incorporated under the Companies Act, 2013, with its registered office in Bengaluru, Karnataka, India; and
2. **The Subscribing Healthcare Entity / Clinic / Hospital** (**"Customer"**, **"Clinic"**, or **"Data Fiduciary"**).

**Statutory Fiduciary Architecture:**  
Under the Digital Personal Data Protection Act, 2023 (DPDP Act), the **Clinic is the Data Fiduciary** with respect to all patient digital personal data and clinical health records, and **Praxis AI is the Data Processor**, processing personal data strictly pursuant to this Agreement and the attached Data Processing Agreement (DPA).

---

## 2. Platform Scope and Permitted Use

2.1. **Clinical Core Features:** Praxis AI licenses non-exclusive, multi-tenant B2B access to the software platform solely for:
- Video and audio telemedicine consultations via WebRTC.
- Patient scheduling and clinical intake workflows.
- Standardized e-prescriptions conforming to NMC Telemedicine Practice Guidelines 2020.
- Clinician documentation and encrypted record keeping.

2.2. **No Direct-to-Patient Marketing:** Praxis AI provides an infrastructure tool for healthcare institutions. Praxis AI does not solicit patients, advertise healthcare services, or operate an open consumer medical marketplace.

---

## 3. Practitioner Verification and Clinical Warranties

3.1. **Practitioner Registration:** The Clinic warrants that every practitioner provisioned on the platform holds an active, valid registration with the **National Medical Commission (NMC)** or a **State Medical Council (SMC)**, or an active license from the **Rehabilitation Council of India (RCI)** for clinical psychologists.

3.2. **Verification Gate:** Practitioners must undergo manual admin verification of their registration number prior to conducting consultations. Unverified practitioners are blocked by server-enforced controls from initiating patient sessions.

3.3. **Prescription Authority:** 
- Only Registered Medical Practitioners (RMPs) may issue electronic prescriptions.
- Clinical psychologists and administrative staff are strictly prohibited and server-blocked from generating prescriptions.
- Schedule X drugs and narcotics under the NDPS Act are hard-blocked on the platform in compliance with NMC Telemedicine Guidelines.

---

## 4. Assistive AI and "Research Use Only" (RUO) Disclaimers

4.1. **Assistive Nature:** AI-assisted clinical documentation (SOAP notes), crisis keyword flags, and acoustic/facial biomarker tools are **heuristic assistive aids only**. They do **not** constitute medical devices under the Medical Devices Rules, 2017 or the CDSCO SaMD Guidance `CDSCO/MD/GD/MDSW/01/2026`.

4.2. **Research Mode Prerequisite:** Acoustic and facial kinematic analysis features are **disabled by default**. They can only be activated under **Research Mode**, requiring:
1. Valid Institutional Ethics Committee (IEC) approval document;
2. Signed Institutional Research Agreement;
3. Recorded Super-Admin approval in the server audit trail.

4.3. **RUO Labeling:** All Research Mode interfaces and telemetry outputs are watermarked: *"Research use only. Not for diagnosis or treatment decisions."* Biomarker numbers are excluded from the statutory clinical record unless explicitly archived as a research addendum by the clinician.

---

## 5. Subscriptions, Fees, and Indian Taxes

5.1. **Subscription Fees:** Fees are charged on a per-seat, recurring subscription basis in Indian Rupees (INR) via Razorpay (supporting UPI Autopay, e-NACH mandates, and credit/debit cards).

5.2. **Goods and Services Tax (GST):** 
- SaaS subscriptions are subject to **18% GST** under **SAC Code 998313** (Information Technology Software Services).
- GST is charged additionally on all invoices. Tax invoices display the Clinic's GSTIN, Praxis AI's GSTIN, Place of Supply, and CGST/SGST/IGST breakdown.

5.3. **Tax Deducted at Source (TDS):** Where the Clinic is required to deduct tax under Section 194J of the Income-tax Act, 1961, the Clinic shall remit the withholding tax to the Government and provide valid Form 16A certificates within statutory quarterly timelines.

5.4. **RBI E-Mandate Compliance:** Recurring card and UPI payments comply with RBI directions (24-hour pre-debit notifications via SMS/email, ₹15,000 AFA OTP threshold, and frictionless customer-initiated cancellation).

---

## 6. Data Residency, Security, and Incident Reporting

6.1. **India Data Localization:** All personal data, health records, audio/video streams, backups, and audit logs are hosted strictly in Google Cloud India regions (`asia-south1` Mumbai / `asia-south2` Delhi).

6.2. **Incident Notification:** In the event of a confirmed personal data breach:
- Praxis AI shall notify the Clinic without undue delay (within 24 hours).
- Praxis AI shall support the Clinic in fulfilling mandatory reporting to the **Indian Computer Emergency Response Team (CERT-In)** within 6 hours and the **Data Protection Board of India (DPBI)** within statutory deadlines.

---

## 7. Limitation of Liability and Indemnity

7.1. **Medical Decision Liability:** All medical diagnoses, clinical decisions, prescriptions, crisis interventions, and patient care remain the sole, non-delegable responsibility of the attending clinician and the Clinic. Praxis AI disclaims all liability arising from clinical malpractice, improper drug selection, or failure of human escalation.

7.2. **Liability Cap:** Except for willful misconduct or breach of the DPA, each party's aggregate liability under this Agreement shall not exceed the total subscription fees paid by the Clinic in the twelve (12) months preceding the incident.

---

## 8. Governing Law and Dispute Resolution

This Agreement shall be governed by and construed in accordance with the **laws of India**. Any dispute arising out of or in connection with this Agreement shall be referred to arbitration in **Bengaluru, Karnataka**, administered by a sole arbitrator appointed mutually by the parties under the Arbitration and Conciliation Act, 1996. The courts of Bengaluru shall have exclusive supervisory jurisdiction.
