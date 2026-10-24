# PERSONAL DATA BREACH RESPONSE AND INCIDENT MANAGEMENT PLAN

> **DRAFT: REQUIRES LAWYER REVIEW**  
> **Status:** Promulgated pursuant to Section 8(6) of the Digital Personal Data Protection Act, 2023 (DPDP Act), Rule 11 of the DPDP Rules, 2025, and CERT-In Directions 2022 (No. 20(3)/2022-CERT-In).  
> **Matrix Reference:** Matrix Rows 1 (DPDP Breach Notification), 5 (CERT-In 6-Hour Reporting Window).  
> **Last Updated:** 24 October 2026

---

## 1. Dual-Clock Statutory Notification Windows

Upon confirmation of any personal data breach, security incident, unauthorized exfiltration, or cryptographic key compromise:

```
+--------------------------------------------------------------------------------+
| DUAL STATUTORY NOTIFICATION TIMELINES (MANDATORY UNDER INDIAN LAW)             |
+--------------------------------------------------------------------------------+
|  T + 0 hours : Breach confirmed by Incident Response Team (IRT)                |
|  T + 6 hours : MANDATORY Incident Report to CERT-In (CERT-In Directions 2022)  |
|  T + 24 hours: Data Processor (Praxis AI) formal notice to Clinic Fiduciary    |
|  T + 72 hours: MANDATORY Formal Notice to Data Protection Board of India (DPBI)|
|  Immediate   : Clear, plain-language notification to affected Data Principals  |
+--------------------------------------------------------------------------------+
```

---

## 2. Incident Classification Matrix

| Severity Level | Definition | Mandatory Actions |
| :--- | :--- | :--- |
| **P0 - Catastrophic** | Bulk patient health record compromise, database dump, unauthorized credential access to clinical database. | Immediate system isolation, 6-hr CERT-In report, 72-hr DPBI report, mass patient SMS/email alert, executive briefing. |
| **P1 - Severe** | Single-tenant database isolation failure, unauthorized practitioner account compromise, localized consult recording leak. | Session revocation, tenant freeze, forensic analysis, notification to affected clinic and patients. |
| **P2 - Moderate** | Transient unauthorized API access caught by WAF, failed credential stuffing attack with zero compromised accounts. | Internal incident documentation, IP block, 6-month log retention under CERT-In. |

---

## 3. Five-Step Incident Response Protocol

### Step 1: Identification & Triage (T + 0 to T + 1 Hour)
- Lead Security Engineer verifies detection via automated telemetry scrubbers or SIEM alerts.
- Confirmed breaches trigger creation of an immutable record in the **Statutory Incident Register** (`src/lib/compliance/incident-register.ts`).

### Step 2: Immediate Containment & Isolation (T + 1 to T + 3 Hours)
- Revoke all active session tokens for compromised tenant or user credentials.
- Rotate Google Cloud KMS database encryption keys.
- Isolate affected WebRTC room nodes or API endpoints.

### Step 3: CERT-In Reporting (T + 3 to T + 6 Hours)
- Generate statutory incident report conforming to CERT-In incident reporting guidelines.
- Submit to `incident@cert-in.org.in` with:
  1. Incident type and targeted system IP addresses.
  2. Timestamp of occurrence and timestamp of confirmation.
  3. Immediate impact assessment and containment measures.

### Step 4: Data Protection Board of India (DPBI) & Fiduciary Notice (T + 6 to T + 72 Hours)
- Transmit formal breach bundle to partner clinic Data Fiduciaries within 24 hours.
- Submit prescribed DPBI Notice under DPDP Rules:
  1. Nature, extent, and cause of the breach.
  2. Categories and approximate number of Data Principals affected.
  3. Potential consequences and risks to Data Principals.
  4. Mitigating actions implemented.
  5. Contact details of the designated Grievance Officer.

### Step 5: Data Principal Notification (§ 8(6) DPDP Act)
- Deliver trilingual notifications (EN, HI, MR) directly to affected patients via verified phone and email:
  - Transparent description of what occurred.
  - Recommended precautionary steps (e.g., password reset).
  - Grievance Officer direct contact number.
  - Zero clinical diagnosis details exposed in SMS notification payloads.
