/**
 * Praxis AI - Enterprise Permissions Configuration
 * Single Source of Truth for Frontend Role Authorization.
 * 
 * Strict mapping of the 10-tier hierarchy to granular hospital operational flags.
 */

export type Role =
  | 'patient'
  | 'guardian'
  | 'medical_assistant'
  | 'nurse'
  | 'clinician'
  | 'specialist'
  | 'billing_admin'
  | 'clinic_manager'
  | 'it_support'
  | 'super_admin';

// 20 Granular Healthcare Operational Permissions
export const PERMISSIONS = [
  // Patient / Public
  'view_own_phr',                     // View Personal Health Record
  'book_telemedicine_appointment',    // Schedule a new visit
  'manage_dependents',                // Guardians managing child/ward profiles

  // Triage & Queue Operations
  'view_triage_queue',                // See the incoming patient list
  'assign_triage_priority',           // Conduct initial triage assessment
  'override_triage_priority',         // Elevate a patient (e.g., suspected stroke) past normal queue

  // Clinical Documentation
  'view_standard_notes',              // Read general vitals, chief complaints
  'write_standard_notes',             // Input vitals, general nursing notes
  'view_sensitive_notes',             // Read Psychiatric, Oncology, or highly sensitive DPDP-protected data
  'write_sensitive_notes',            // Author sensitive diagnosis notes

  // Medical Interventions
  'prescribe_standard_medication',    // General pharmacy orders
  'prescribe_controlled_substances',  // High-tier pharmacy orders (requires specialist DEA/NPI mapping in backend)
  'order_diagnostics',                // Request labs, imaging, telemetry

  // Financial & Operations
  'view_hospital_billing_data',       // Read aggregate financial queues
  'process_financial_refunds',        // Execute overrides on billing
  'manage_staff_schedules',           // Shift scheduling and roster management
  'view_anonymized_analytics',        // Read-only access to hospital operational dashboards

  // System & IT
  'view_system_audit_logs',           // View HIPAA/DPDP access trails (who viewed whose record)
  'manage_rbac_assignments',          // Add/Remove staff roles
  'perform_system_override',          // IT level "Break Glass" protocols
  'trigger_emergency_override',       // Clinical level "Break Glass" for patient records
] as const;

export type Permission = typeof PERMISSIONS[number];

/**
 * The Authorization Matrix
 * Maps each role to their EXACT allowed capabilities.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  patient: [
    'view_own_phr',
    'book_telemedicine_appointment'
  ],
  
  guardian: [
    'view_own_phr',
    'book_telemedicine_appointment',
    'manage_dependents'
  ],
  
  medical_assistant: [
    'view_triage_queue',
    'assign_triage_priority',
    'view_standard_notes',
    'write_standard_notes'
  ],
  
  nurse: [
    'view_triage_queue',
    'assign_triage_priority',
    'override_triage_priority',
    'view_standard_notes',
    'write_standard_notes',
    'view_sensitive_notes', // Read-only access to understand patient history, but cannot author
    'trigger_emergency_override',
  ],
  
  clinician: [
    'view_triage_queue',
    'assign_triage_priority',
    'override_triage_priority',
    'view_standard_notes',
    'write_standard_notes',
    'view_sensitive_notes',
    'write_sensitive_notes',
    'prescribe_standard_medication',
    'order_diagnostics',
    'view_anonymized_analytics',
    'trigger_emergency_override',
  ],
  
  specialist: [
    'view_triage_queue',
    'assign_triage_priority',
    'override_triage_priority',
    'view_standard_notes',
    'write_standard_notes',
    'view_sensitive_notes',
    'write_sensitive_notes',
    'prescribe_standard_medication',
    'prescribe_controlled_substances', // Highest clinical prescribing tier
    'order_diagnostics',
    'view_anonymized_analytics',
    'trigger_emergency_override',
  ],
  
  billing_admin: [
    'view_hospital_billing_data',
    'view_anonymized_analytics'
  ],
  
  clinic_manager: [
    'view_hospital_billing_data',
    'process_financial_refunds',
    'manage_staff_schedules',
    'view_anonymized_analytics'
  ],
  
  it_support: [
    'view_system_audit_logs',
    'view_anonymized_analytics'
  ],
  
  super_admin: PERMISSIONS // Implicit access to the entire array of permissions
};

/**
 * Global Authorization Helper
 * Safely evaluates if a given role string possesses a specific operational permission.
 * 
 * @param role - The user's role string from the auth session.
 * @param permission - The specific `Permission` flag to check against.
 * @returns boolean indicating if access is granted.
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  
  // Quick return for System Admins to bypass array lookups
  if (role === 'super_admin') return true;

  // Typecast and lookup
  const permissionsForRole = ROLE_PERMISSIONS[role as Role];
  
  // If role is invalid or not mapped, fail closed (secure default)
  if (!permissionsForRole) return false;
  
  return permissionsForRole.includes(permission);
}
