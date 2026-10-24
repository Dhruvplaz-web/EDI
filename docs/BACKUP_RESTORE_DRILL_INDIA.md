# Praxis AI — India Disaster Recovery & Backup Restoration Runbook
**Document Version:** 1.0 (Indian Cloud Sovereignty Edition)  
**Target Architecture:** Google Cloud Platform India (`asia-south1` Mumbai & `asia-south2` Delhi)  
**Statutory Standards:** DPDP Act 2023 (§ 8 Safeguards), CERT-In Directions 2022, NMC Telemedicine Practice Guidelines 2020  
**Legal Classification:** OPERATIONAL RUNBOOK — REQUIRES LAWYER REVIEW & CISO SIGN-OFF

---

## 1. Objectives & Statutory Targets
- **Recovery Time Objective (RTO):** < 2 Hours (Time to bring full tele-consultation platform online in secondary region).
- **Recovery Point Objective (RPO):** < 15 Minutes (Maximum allowable data loss window).
- **Sovereign Residency Guarantee:** Backups, snapshots, and audit logs are stored strictly in Mumbai (`asia-south1`) and Delhi (`asia-south2`). Cross-border data exfiltration or backup routing outside India is blocked by GCP Organization Policy `constraints/gcp.resourceLocations`.
- **Retention Duration:**
  - Clinical Records & E-Prescriptions: Minimum 3 Years (1,095 days) under Indian Medical Council Regulations 2002.
  - Audit Trail Hash-Chains: Minimum 180 Days under CERT-In Directions 2022 (maintained for 3 years to match clinical logs).
  - High-Frequency Raw Video/Audio Sensor Telemetry: Purged automatically per SaaS plan retention schedules (30 / 365 / 2555 days).

---

## 2. Backup Architecture & Cadence

```
┌────────────────────────────────────────────────────────┐
│             PRIMARY REGION: asia-south1 (Mumbai)       │
│                                                        │
│  Cloud Firestore (Live PHI) ───[Continuous PITR]──────>│ 7-Day Granular Point-in-Time Recovery
│  Cloud Firestore (Nightly)  ───[gcloud export]────────>│ gs://edi-backups-asia-south1 (CMEK Encrypted)
│  Audit Hash-Chains (Hourly) ───[HMAC Export]──────────>│ gs://edi-audit-archive-asia-south1
└──────────────────────────┬─────────────────────────────┘
                           │ Nightly GCP Storage Transfer Service
                           ▼ (Strictly Intra-India Backbone)
┌────────────────────────────────────────────────────────┐
│            SECONDARY DR REGION: asia-south2 (Delhi)    │
│                                                        │
│  Cold Storage Bucket: gs://edi-backups-asia-south2     │
│  Secondary KMS Keyring: asia-south2 (Standby)          │
└────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Emergency Restoration Drill

### Step 3.1: Declare Regional Outage & Mobilize Incident Team
1. Verify `asia-south1` primary outage via Google Cloud Status Dashboard and internal uptime alarms.
2. Record incident in `incident-register.ts` (starts the 6-hour CERT-In clock and 72-hour DPBI clock).
3. Convene Emergency Response Desk (CISO, Clinical Operations Lead, Lead DevOps Engineer).

### Step 3.2: Verify Backup Integrity in Secondary Region (`asia-south2`)
```bash
# List available snapshot archives in the Delhi DR bucket
gcloud storage ls gs://edi-backups-asia-south2/firestore-snapshots/ --project=edi-production-india

# Verify HMAC checksum of latest daily manifest
gcloud storage cat gs://edi-backups-asia-south2/firestore-snapshots/latest-manifest.json
```

### Step 3.3: Execute Database Restoration to DR Firestore Instance
```bash
# Set secondary target region
export TARGET_REGION="asia-south2"
export BACKUP_URI="gs://edi-backups-asia-south2/firestore-snapshots/2026-10-24T00-00-00"

# Trigger Firestore import in Delhi
gcloud firestore import ${BACKUP_URI} \
  --project=edi-production-india \
  --collection-ids='organizations','users','patients','intakes','sessions','prescriptions','audit_logs','dpdp_consents'
```

### Step 3.4: Verify Cryptographic Hash-Chain Integrity
Once imported, run the audit verification routine to prove zero record tampering occurred during transit:
```bash
curl -X POST https://api-delhi.praxis-ai.in/api/cron/audit-export \
  -H "Authorization: Bearer ${CRON_SECRET}"
```
Verify that response returns:
```json
{
  "chainIntegrityVerified": true,
  "recordCount": 1420,
  "chainHeadHash": "...",
  "status": "VALID"
}
```

### Step 3.5: Redirect Global DNS & Traffic
1. Update Cloudflare / Route 53 DNS records:
   - Point `api.praxis-ai.in` and `app.praxis-ai.in` from `asia-south1` Cloud Run to `asia-south2` Cloud Run.
   - TTL = 60 seconds.
2. Perform synthetic login and consult test room verification.

---

## 4. Biannual Disaster Recovery Drill Protocol
- **Frequency:** Conducted twice annually (April and October).
- **Execution Target:** Carried out in isolated staging sandbox `edi-dr-sandbox-asia-south1`.
- **Drill Checklist:**
  1. [ ] Point-in-time recovery restore to a specific minute tested.
  2. [ ] Zero Aadhaar check verified clean across imported records.
  3. [ ] RMP prescriber verification gates remain intact.
  4. [ ] Audit chain integrity matches pre-disaster hash.
  5. [ ] Drill report logged in compliance register.
