/**
 * Multi-Tenant Context & Scope Helpers for Praxis AI
 * Ensures every read and write operation is tenant-scoped with explicit orgId validation.
 */

export interface TenantContext {
  orgId: string;
  userId: string;
  role: 'super_admin' | 'clinical_director' | 'clinician' | 'patient' | 'operations';
  isDemo: boolean;
}

export const DEFAULT_DEMO_ORG_ID = 'org_demo_praxis_sandbox';

/**
 * Validates that an incoming request or record matches the tenant boundary.
 * Super Admins can cross boundaries if explicitly requested for platform operations.
 */
export function validateTenantAccess(
  context: TenantContext,
  targetOrgId: string
): boolean {
  if (context.role === 'super_admin') {
    return true;
  }
  return context.orgId === targetOrgId;
}

/**
 * Ensures demo mode records are isolated and cannot be committed as real clinical data.
 */
export function assertClinicalDataIsolation(isDemoRecord: boolean, isDemoTenant: boolean): void {
  if (isDemoRecord && !isDemoTenant) {
    throw new Error('Security Violation: Attempted to inject demo records into a production clinical organization.');
  }
}
